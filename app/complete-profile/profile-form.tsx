"use client";

import { UploadButton } from "@/lib/uploadthing";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  isValidTenDigitPhoneNumber,
  normalizePhoneNumber,
} from "@/lib/profile";
import { getUserAvatarUrl } from "@/lib/avatar";

type ProfileFormState = {
  email: string;
  name: string;
  phone: string;
  image: string;
};

type CompleteProfileFormProps = {
  initialProfile: ProfileFormState;
};

function hasValue(value: string) {
  return value.trim().length > 0;
}

export default function CompleteProfileForm({
  initialProfile,
}: CompleteProfileFormProps) {
  const router = useRouter();
  const { update } = useSession();
  const [form, setForm] = useState<ProfileFormState>(initialProfile);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const isComplete =
    hasValue(form.name) &&
    hasValue(form.email) &&
    hasValue(form.phone);
  const avatarPreviewSrc = getUserAvatarUrl({
    image: form.image,
    name: form.name,
    email: form.email,
    size: 160,
  });

  async function onSubmit() {
    if (!isComplete) {
      setMessage("Please fill all required fields before continuing.");
      return;
    }

    const normalizedPhone = normalizePhoneNumber(form.phone);
    if (!isValidTenDigitPhoneNumber(normalizedPhone)) {
      setMessage("Phone number must contain exactly 10 digits.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          image: form.image,
          phone: normalizedPhone,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessage(data?.error ?? "Unable to save profile details.");
        setSaving(false);
        return;
      }

      await update({
        name: form.name,
        image: form.image,
      });

      router.push("/");
      router.refresh();
    } catch {
      setMessage("Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.2),transparent_35%),radial-gradient(circle_at_80%_15%,rgba(251,191,36,0.18),transparent_30%),radial-gradient(circle_at_75%_80%,rgba(16,185,129,0.2),transparent_35%)]" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl items-center px-4 py-10 sm:px-6">
        <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300/90">
              One Last Step
            </p>
            <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
              Complete Your Profile
            </h1>
            <p className="mt-3 max-w-xl text-sm text-slate-200/85">
              Fill your required account details to continue.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-200/90">
                  Email
                </label>
                <input
                  disabled
                  value={form.email}
                  className="w-full rounded-xl border border-white/15 bg-slate-900/70 px-4 py-3 text-sm text-slate-300"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-200/90">
                  Full Name
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border border-white/15 bg-slate-900/70 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-cyan-300/55 focus:outline-none focus:ring-2 focus:ring-cyan-300/25"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-200/90">
                  Phone Number
                </label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Enter 10-digit phone number"
                  inputMode="numeric"
                  maxLength={10}
                  className="w-full rounded-xl border border-white/15 bg-slate-900/70 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-cyan-300/55 focus:outline-none focus:ring-2 focus:ring-cyan-300/25"
                />
                <p className="mt-2 text-xs text-slate-300/75">
                  Enter exactly 10 digits (no country code).
                </p>
              </div>
            </div>

            {message ? (
              <div className="mt-5 rounded-xl border border-rose-300/30 bg-rose-500/15 px-4 py-3 text-sm text-rose-100">
                {message}
              </div>
            ) : null}

            <button
              onClick={onSubmit}
              disabled={saving || !isComplete}
              className="mt-6 flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving profile..." : "Continue to Home"}
            </button>
          </section>

          <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200/90">
              Profile Photo
            </p>
            <h2 className="mt-3 text-2xl font-bold text-white">Upload Image</h2>
            <p className="mt-3 text-sm text-slate-200/85">
              Upload your profile image (up to 5MB). This step is optional.
            </p>

            <div className="mt-6 flex items-center gap-4">
              <div className="h-24 w-24 overflow-hidden rounded-2xl border border-white/15 bg-slate-800/80">
                <img
                  src={avatarPreviewSrc}
                  alt="Profile preview"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex-1">
                <UploadButton
                  endpoint="profileImage"
                  appearance={{
                    button:
                      "w-full rounded-xl border border-cyan-300/50 bg-cyan-400/15 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/25",
                    allowedContent: "text-xs text-slate-300 mt-2",
                  }}
                  onClientUploadComplete={(res) => {
                    const file = res?.[0];
                    const url = file?.ufsUrl || file?.url;
                    if (url) {
                      setForm((current) => ({ ...current, image: url }));
                      setMessage("");
                    }
                  }}
                  onUploadError={(error) => setMessage(error.message)}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
