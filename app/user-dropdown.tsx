"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  ChartColumnBigIcon,
  Settings2Icon,
  UserIcon,
  LogOutIcon,
} from "lucide-react";
import { getUserAvatarUrl } from "@/lib/avatar";

export default function UserDropdown() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (!session?.user) return null;

  const name = session.user.name ?? "User";
  const image = session.user.image ?? "";
  const avatarSrc = getUserAvatarUrl({
    image,
    name,
    email: session.user.email,
    size: 64,
  });

  return (
    <div ref={boxRef} className="relative flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 overflow-hidden rounded-full border border-white/20 bg-white/10 flex items-center justify-center">
          <img
            src={avatarSrc}
            alt={name}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        <span className="text-sm font-medium text-white">{name}</span>
      </div>

      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full border border-white/25 px-3 py-1 text-sm text-white hover:bg-white/10"
      >
        Menu
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
          >
            <ChartColumnBigIcon size={16} className="text-slate-600" />
            Dashboard
          </Link>

          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
          >
            <Settings2Icon size={16} className="text-slate-600" />
            Account Settings
          </Link>

          <Link
            href="/account/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
          >
            <UserIcon size={16} className="text-slate-600" />
            Profile
          </Link>

          <div className="my-1 h-px bg-slate-200" />

          <button
            onClick={async () => {
              setOpen(false);
              await signOut({ redirect: false });
              window.location.href = "/login";
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOutIcon size={16} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
