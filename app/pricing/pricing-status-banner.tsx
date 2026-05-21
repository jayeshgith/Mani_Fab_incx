"use client";

import { useSearchParams } from "next/navigation";

export default function PricingStatusBanner() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const plan = searchParams.get("plan");

  if (status !== "success" && status !== "cancelled") {
    return null;
  }

  if (status === "success") {
    return (
      <div className="mb-8 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        Payment successful. Your {plan === "pro" ? "Pro" : "Base"} plan is now
        active.
      </div>
    );
  }

  return (
    <div className="mb-8 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      Checkout was cancelled. You can select a plan anytime.
    </div>
  );
}
