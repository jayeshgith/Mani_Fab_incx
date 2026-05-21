"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function AppBreadcrumbs() {
  const pathname = usePathname();
  const router = useRouter();

  // These routes already have detailed page-level breadcrumbs.
  if (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/transactions") ||
    pathname === "/groups/dashboard" ||
    pathname === "/groups/new" ||
    pathname === "/family/dashboard" ||
    (pathname.startsWith("/family/") && pathname.endsWith("/transfer"))
  ) {
    return null;
  }

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-3 sm:px-6">
      <button
        type="button"
        onClick={handleBack}
        aria-label="Go back"
        title="Go back"
        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
    </div>
  );
}
