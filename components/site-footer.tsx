"use client";

import { usePathname } from "next/navigation";

const AUTH_PATH_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
] as const;

export default function SiteFooter() {
  const pathname = usePathname();

  const isAuthPage = AUTH_PATH_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (isAuthPage) {
    return null;
  }

  return (
    <footer className="border-t border-slate-200/80 bg-slate-50">
      <div
        className="mx-auto w-full max-w-7xl px-4 py-5 text-center text-xs text-slate-500 sm:px-6 lg:px-8"
      >
        <p>&copy; 2026 Fabinex. All rights reserved.</p>
        <p className="mt-1 text-slate-700">
          Contact:{" "}
          <a
            className="text-slate-900 underline decoration-slate-400 underline-offset-2 hover:text-slate-700"
            href="mailto:support@fabsol.in"
          >
            support@fabsol.in
          </a>
        </p>
      </div>
    </footer>
  );
}
