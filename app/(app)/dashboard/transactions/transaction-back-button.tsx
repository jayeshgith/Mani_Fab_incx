"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

type TransactionBackButtonProps = {
  fallbackHref: string;
};

export default function TransactionBackButton({
  fallbackHref,
}: TransactionBackButtonProps) {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label="Go back"
      title="Go back"
      className="inline-flex items-center rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-slate-700 transition hover:bg-slate-200"
    >
      <ChevronLeft className="h-4 w-4" />
    </button>
  );
}
