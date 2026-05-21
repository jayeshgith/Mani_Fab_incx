"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function PricingBackButton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
      <Link
        href="/"
        aria-label="Back to home"
        title="Back to home"
        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>
    </div>
  );
}
