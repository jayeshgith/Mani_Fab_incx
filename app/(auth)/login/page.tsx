"use client";

import { Suspense, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthBreadcrumbs from "@/components/auth-breadcrumbs";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  async function handleCredentialsLogin() {
    setLoading(true);
    setMsg("");

    if (!email || !password) {
      setLoading(false);
      setMsg("Please enter email and password");
      return;
    }

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      setLoading(false);

      if (res?.error) {
        const err = res.error;
        if (err === "CredentialsSignin" || /credential/i.test(err)) {
          setMsg("Invalid email or password");
        } else {
          setMsg(typeof err === "string" ? err : "Sign in failed");
        }
        return;
      }

      if (!res?.ok) {
        setMsg("Invalid email or password");
        return;
      }

      router.push(res.url || callbackUrl || "/");
      router.refresh();
    } catch {
      setLoading(false);
      setMsg("An unexpected error occurred. Please try again.");
    }
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
            <div className="mb-4 inline-flex rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 p-3 shadow-lg shadow-orange-500/35">
              <svg
                className="h-6 w-6 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path
                  fillRule="evenodd"
                  d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h1 className="bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
              Welcome Back
            </h1>
            <p className="mt-2 text-sm text-slate-200/80">
              Sign in to your account to continue
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
              onClick={() => signIn("google", { callbackUrl })}
              className="group flex w-full items-center justify-center gap-3 rounded-xl border border-white/25 bg-slate-900/60 px-4 py-3 text-sm font-semibold text-slate-50 transition-all duration-300 hover:border-amber-200/50 hover:bg-slate-800/70"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 48 48"
                aria-hidden
                className="transition-transform duration-200 group-hover:scale-110"
              >
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

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-100/35 to-transparent" />
            <span className="text-xs font-medium text-slate-300/60">OR</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-100/35 to-transparent" />
          </div>

          <div
            className={`mb-6 space-y-3 transition-all duration-700 ${
              isMounted
                ? "translate-y-0 opacity-100 delay-200"
                : "translate-y-2 opacity-0"
            }`}
          >
            <div className="group relative">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="Email address"
                className="w-full rounded-xl border border-white/20 bg-slate-950/60 px-4 py-3 text-sm text-slate-50 placeholder-slate-400/70 transition-all duration-300 focus:border-amber-300/40 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <svg
                className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-amber-300"
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
            </div>

            <div className="group relative">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                className="w-full rounded-xl border border-white/20 bg-slate-950/60 px-4 py-3 pr-20 text-sm text-slate-50 placeholder-slate-400/70 transition-all duration-300 focus:border-amber-300/40 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300/70 transition-colors duration-200 hover:text-amber-200"
              >
                {showPassword ? (
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

          <div
            className={`transition-all duration-700 ${
              isMounted
                ? "translate-y-0 opacity-100 delay-300"
                : "translate-y-2 opacity-0"
            }`}
          >
            <button
              onClick={handleCredentialsLogin}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 py-3 text-sm font-semibold text-white transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/45 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <svg
                    className="h-5 w-5 animate-spin"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>

            {msg ? (
              <div className="mt-4 rounded-xl border border-rose-300/40 bg-rose-500/15 p-3">
                <p className="flex items-center gap-2 text-sm font-medium text-rose-200">
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {msg}
                </p>
              </div>
            ) : null}

            <div className="mt-6 space-y-3 text-center text-sm">
              <p>
                <a
                  href="/forgot-password"
                  className="font-medium text-slate-200/80 transition-colors hover:text-amber-200"
                >
                  Forgot password?
                </a>
              </p>
              <p className="text-slate-300/70">
                Don't have an account?{" "}
                <a
                  href="/signup"
                  className="font-semibold text-amber-300 transition-colors hover:text-amber-200"
                >
                  Create one
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
