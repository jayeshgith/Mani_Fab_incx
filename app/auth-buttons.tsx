"use client";

import Link from "next/link";
import { ChevronDownIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { getUserAvatarUrl } from "@/lib/avatar";

type AuthButtonsProps = {
  showGroupDashboard?: boolean;
  showFamilyDashboard?: boolean;
  menuMode?: "dropdown" | "inline";
};

export default function AuthButtons({
  showGroupDashboard = false,
  showFamilyDashboard = false,
  menuMode = "dropdown",
}: AuthButtonsProps) {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (status === "loading") return null;

  if (!session?.user) {
    return (
      <div
        className={
          menuMode === "inline"
            ? "flex w-full flex-col gap-2"
            : "flex flex-wrap items-center gap-2 sm:gap-3"
        }
      >
        <Link
          href="/login"
          className={
            menuMode === "inline"
              ? "rounded-lg border border-white/15 px-3 py-2 text-sm font-medium hover:bg-white/10"
              : "rounded-lg px-3 py-2 text-xs font-medium hover:bg-white/10 sm:px-4 sm:text-sm"
          }
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className={
            menuMode === "inline"
              ? "rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/20"
              : "rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/20 sm:px-4 sm:text-sm"
          }
        >
          Sign up
        </Link>
      </div>
    );
  }

  const name = session.user.name ?? "User";
  const image = session.user.image;
  const avatarSrc = getUserAvatarUrl({
    image,
    name,
    email: session.user.email,
    size: 64,
  });

  if (menuMode === "inline") {
    return (
      <div className="w-full space-y-2">
        <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-3 py-2">
          <img
            src={avatarSrc}
            alt={name}
            className="h-9 w-9 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="truncate text-xs text-white/70">
              {session.user.email || "Account"}
            </p>
          </div>
        </div>

        <Link
          href="/account"
          className="block rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/10"
        >
          Manage Account
        </Link>
        <Link
          href="/dashboard"
          className="block rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/10"
        >
          Dashboard
        </Link>
        <Link
          href="/account/profile"
          className="block rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/10"
        >
          Profile
        </Link>
        {showGroupDashboard ? (
          <Link
            href="/groups/dashboard"
            className="block rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/10"
          >
            Society Dashboard
          </Link>
        ) : null}
        {showFamilyDashboard ? (
          <Link
            href="/family/dashboard"
            className="block rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/10"
          >
            Family Dashboard
          </Link>
        ) : null}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full rounded-lg border border-white/15 px-3 py-2 text-left text-sm font-semibold hover:bg-white/10"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative z-50">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 hover:bg-white/20 sm:gap-3"
      >
        <div className="h-9 w-9 overflow-hidden rounded-full bg-white/10">
          <img
            src={avatarSrc}
            alt={name}
            className="h-9 w-9 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="hidden sm:flex flex-col items-start leading-tight">
          <span className="text-sm font-semibold">{name}</span>
          <span className="text-xs text-white/70">Account</span>
        </div>
        <ChevronDownIcon className="h-4 w-4 text-white/70" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#0b0b0f] shadow-xl">
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-sm hover:bg-white/10"
          >
            Manage Account
          </Link>
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-sm hover:bg-white/10"
          >
            Dashboard
          </Link>
          <Link
            href="/account/profile"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-sm hover:bg-white/10"
          >
            Profile
          </Link>
          {showGroupDashboard ? (
            <Link
              href="/groups/dashboard"
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-sm hover:bg-white/10"
            >
              Society Dashboard
            </Link>
          ) : null}
          {showFamilyDashboard ? (
            <Link
              href="/family/dashboard"
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-sm hover:bg-white/10"
            >
              Family Dashboard
            </Link>
          ) : null}
          <div className="h-px bg-white/10" />
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full px-4 py-3 text-left text-sm hover:bg-white/10"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
