"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
export default function AuthBreadcrumbs() {
  const router = useRouter();

  function handleBack() {
    router.push("/");
  }

  return (
    <div className="inline-flex items-center rounded-xl border border-white/20 bg-slate-950/60 px-3 py-2 backdrop-blur-md">
      <button
        type="button"
        onClick={handleBack}
        aria-label="Go back to home"
        title="Go back to home"
        className="inline-flex items-center gap-1 rounded-md border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
