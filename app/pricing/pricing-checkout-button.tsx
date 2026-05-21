"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type PricingCheckoutButtonProps = {
  planId: "base" | "pro";
  cta: string;
  featured?: boolean;
};

type CheckoutResponse = {
  url?: string;
  error?: string;
  loginUrl?: string;
};

export default function PricingCheckoutButton({
  planId,
  cta,
  featured = false,
}: PricingCheckoutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleCheckout() {
    try {
      setIsLoading(true);
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId }),
      });

      const data = (await res.json().catch(() => ({}))) as CheckoutResponse;

      if (res.status === 401 && data.loginUrl) {
        router.push(data.loginUrl);
        return;
      }

      if (!res.ok || !data.url) {
        toast.error(data.error || "Could not start checkout.");
        return;
      }

      window.location.href = data.url;
    } catch {
      toast.error("Could not start checkout.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCheckout}
      disabled={isLoading}
      className={`mt-7 w-full rounded-xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
        featured
          ? "bg-gradient-to-r from-emerald-300 to-cyan-300 text-slate-950 hover:from-emerald-200 hover:to-cyan-200"
          : "bg-slate-900 text-white hover:bg-slate-800"
      }`}
    >
      {isLoading ? "Redirecting..." : cta}
    </button>
  );
}
