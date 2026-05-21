"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import AuthBreadcrumbs from "@/components/auth-breadcrumbs";

const LOWERCASE_CHARS = "abcdefghijklmnopqrstuvwxyz";
const UPPERCASE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUMBER_CHARS = "0123456789";
const SYMBOL_CHARS = "!@#$%^&*()_+-=[]{}|;:,.<>?";

function generateStrongPassword(length = 14) {
  const safeLength = Math.max(12, length);
  const allChars =
    LOWERCASE_CHARS + UPPERCASE_CHARS + NUMBER_CHARS + SYMBOL_CHARS;

  const rngValues = new Uint32Array(safeLength + 8);
  const hasCrypto =
    typeof globalThis !== "undefined" &&
    Boolean(globalThis.crypto?.getRandomValues);

  if (hasCrypto) {
    globalThis.crypto.getRandomValues(rngValues);
  } else {
    for (let i = 0; i < rngValues.length; i += 1) {
      rngValues[i] = Math.floor(Math.random() * 0xffffffff);
    }
  }

  let cursor = 0;
  const nextIndex = (max: number) => {
    const value = rngValues[cursor % rngValues.length];
    cursor += 1;
    return value % max;
  };

  const picks = [
    LOWERCASE_CHARS[nextIndex(LOWERCASE_CHARS.length)],
    UPPERCASE_CHARS[nextIndex(UPPERCASE_CHARS.length)],
    NUMBER_CHARS[nextIndex(NUMBER_CHARS.length)],
    SYMBOL_CHARS[nextIndex(SYMBOL_CHARS.length)],
  ];

  while (picks.length < safeLength) {
    picks.push(allChars[nextIndex(allChars.length)]);
  }

  for (let i = picks.length - 1; i > 0; i -= 1) {
    const swapIndex = nextIndex(i + 1);
    [picks[i], picks[swapIndex]] = [picks[swapIndex], picks[i]];
  }

  return picks.join("");
}

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  async function handleSignup() {
    setMsg(null);
    setPasswordNotice(null);
    setLoading(true);

    if (password !== confirmPassword) {
      setMsg("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(data?.message || "Signup failed");
        setLoading(false);
        return;
      }

      const login = await signIn("credentials", {
        email,
        password,
        redirect: true,
        callbackUrl: "/",
      });

      setLoading(false);
      return login;
    } catch (e: any) {
      setMsg(e?.message || "Something went wrong");
      setLoading(false);
    }
  }

  function handleGeneratePassword() {
    const generatedPassword = generateStrongPassword();
    setPassword(generatedPassword);
    setConfirmPassword(generatedPassword);
    setShowPass(true);
    setMsg(null);
    setPasswordNotice("Strong password generated and applied.");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#0b1220] via-[#16203b] to-[#2f1f2f] px-4 py-6 sm:px-6">
      <div className="absolute left-4 top-4 z-20 sm:left-6 sm:top-6">
        <AuthBreadcrumbs />
      </div>
      <div className="absolute top-20 -left-32 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl animate-pulse" />
      <div className="absolute bottom-32 -right-32 h-72 w-72 rounded-full bg-orange-400/20 blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/3 h-80 w-80 rounded-full bg-sky-400/15 blur-3xl animate-pulse delay-500" />

      <div className="relative z-10 w-full max-w-md">
        <div
          className={`rounded-3xl border border-white/15 bg-slate-950/45 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl transition-all duration-700 sm:p-8 ${
            isMounted
              ? "translate-y-0 scale-100 opacity-100"
              : "translate-y-3 scale-[0.985] opacity-0"
          }`}
        >
          <div
            className={`mb-7 text-center transition-all duration-700 ${
              isMounted ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
            }`}
          >
            <h1 className="bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
              Join Us
            </h1>
            <p className="mt-2 text-sm text-slate-200/80">
              Create your account and start managing your finances
            </p>
          </div>

          <div
            className={`transition-all duration-700 ${
              isMounted
                ? "translate-y-0 opacity-100 delay-100"
                : "translate-y-2 opacity-0"
            }`}
          >
            <button
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/25 bg-slate-900/60 py-3 text-sm font-semibold text-slate-50 transition-all duration-300 hover:border-amber-200/50 hover:bg-slate-800/70"
            >
              <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.3 0 6.3 1.2 8.6 3.2l6.4-6.4C34.9 2.3 29.7 0 24 0 14.6 0 6.4 5.4 2.5 13.2l7.5 5.8C12.1 13.2 17.6 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.1 24.5c0-1.7-.2-3.3-.5-4.9H24v9.3h12.4c-.5 2.6-2 4.8-4.3 6.3l6.7 5.2c3.9-3.6 6.3-8.9 6.3-15.9z"
                />
                <path
                  fill="#FBBC05"
                  d="M10 28.9c-.5-1.5-.8-3.1-.8-4.9s.3-3.4.8-4.9l-7.5-5.8C.9 16.4 0 20.1 0 24s.9 7.6 2.5 10.7l7.5-5.8z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.5 0 12-2.1 16-5.8l-6.7-5.2c-1.9 1.3-4.3 2.1-7.3 2.1-6.4 0-11.9-3.7-14-9.2l-7.5 5.8C6.4 42.6 14.6 48 24 48z"
                />
              </svg>
              Continue with Google
            </button>
          </div>

          {/* <button
            onClick={() => signIn("facebook", { callbackUrl: "/" })}
            className="mt-3 flex w-full items-center justify-center gap-3 rounded-xl bg-[#1877F2] py-3 text-sm font-semibold text-white hover:bg-[#166fe0]"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="white"
              aria-hidden
            >
              <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H8v-3h2.4V9.5c0-2.4 1.4-3.7 3.6-3.7 1 0 2 .1 2 .1v2.3h-1.1c-1.1 0-1.4.7-1.4 1.3V12H16l-.4 3h-2.5v7A10 10 0 0 0 22 12Z" />
            </svg>
            Continue with Facebook
          </button> */}

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-100/35 to-transparent" />
            <span className="text-xs text-slate-300/60">or</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-100/35 to-transparent" />
          </div>

          <div
            className={`space-y-4 transition-all duration-700 ${
              isMounted
                ? "translate-y-0 opacity-100 delay-200"
                : "translate-y-2 opacity-0"
            }`}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-200/85">
                  First name
                </label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Shree"
                  className="w-full rounded-xl border border-white/20 bg-slate-950/60 px-4 py-3 text-sm text-slate-50 placeholder-slate-400/70 transition-all duration-300 focus:border-amber-300/40 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-slate-200/85">
                  Last name
                </label>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Ram"
                  className="w-full rounded-xl border border-white/20 bg-slate-950/60 px-4 py-3 text-sm text-slate-50 placeholder-slate-400/70 transition-all duration-300 focus:border-amber-300/40 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-slate-200/85">
                Email address
              </label>
              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-amber-300/70"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  type="email"
                  className="w-full rounded-xl border border-white/20 bg-slate-950/60 py-3 pl-12 pr-4 text-sm text-slate-50 placeholder-slate-400/70 transition-all duration-300 focus:border-amber-300/40 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-200/85">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-xs font-semibold text-amber-300 transition-colors duration-200 hover:text-amber-200"
                >
                  Auto-generate
                </button>
              </div>
              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-amber-300/70"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  type={showPass ? "text" : "password"}
                  className="w-full rounded-xl border border-white/20 bg-slate-950/60 py-3 pl-12 pr-12 text-sm text-slate-50 placeholder-slate-400/70 transition-all duration-300 focus:border-amber-300/40 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300/70 transition-colors duration-200 hover:text-amber-200"
                >
                  {showPass ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-slate-200/85">
                Re-enter password
              </label>
              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-amber-300/70"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  type={showPass ? "text" : "password"}
                  className="w-full rounded-xl border border-white/20 bg-slate-950/60 py-3 pl-12 pr-12 text-sm text-slate-50 placeholder-slate-400/70 transition-all duration-300 focus:border-amber-300/40 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300/70 transition-colors duration-200 hover:text-amber-200"
                >
                  {showPass ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {passwordNotice ? (
                <p className="mt-2 text-xs text-emerald-300/90">{passwordNotice}</p>
              ) : null}
            </div>
          </div>

          {msg ? (
            <div className="mt-4 rounded-xl border border-rose-300/40 bg-rose-500/15 p-3">
              <p className="text-xs font-medium text-rose-200">{msg}</p>
            </div>
          ) : null}

          <div
            className={`transition-all duration-700 ${
              isMounted
                ? "translate-y-0 opacity-100 delay-300"
                : "translate-y-2 opacity-0"
            }`}
          >
            <button
              onClick={handleSignup}
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 py-3 text-sm font-semibold text-white transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/45 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Creating account...
                </span>
              ) : (
                "Create Account ->"
              )}
            </button>

            <p className="mt-6 text-center text-sm text-slate-200/75">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-amber-300 transition-colors duration-200 hover:text-amber-200"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
