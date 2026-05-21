import Link from "next/link";
import { Check, LandmarkIcon } from "lucide-react";
import { auth } from "@/auth";
import { BILLING_PLANS } from "@/lib/billing-plans";
import PricingCheckoutButton from "./pricing-checkout-button";
import PricingStatusBanner from "./pricing-status-banner";
import PricingBackButton from "./pricing-back-button";

const NEXT_PUBLIC_APP_NAME = `${process.env.NEXT_PUBLIC_APP_NAME || "Fabinex"}`;

export default async function PricingPage() {
  const session = await auth();
  const dashboardHref = session?.user
    ? "/dashboard"
    : "/login?callbackUrl=%2Fpricing";
  const dashboardLabel = session?.user ? "Go to Dashboard" : "Sign In";

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-slate-50 via-sky-50 to-emerald-50 text-slate-900">
      <div className="pointer-events-none absolute -left-12 top-14 h-56 w-56 rounded-full bg-sky-300/25 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-52 h-64 w-64 rounded-full bg-emerald-300/20 blur-3xl" />

      <nav className="relative z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="mr-auto flex items-center gap-2 text-xl font-bold text-slate-900 sm:text-2xl">
            <LandmarkIcon className="text-emerald-600" />
            {NEXT_PUBLIC_APP_NAME}
          </Link>
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100">
              Home
            </Link>
            <Link
              href={dashboardHref}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100">
              {dashboardLabel}
            </Link>
          </div>

          <details className="relative ml-auto md:hidden">
            <summary className="cursor-pointer list-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 [&::-webkit-details-marker]:hidden">
              Menu
            </summary>
            <div className="absolute right-0 top-11 z-50 flex w-56 flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-2xl">
              <Link
                href="/"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100">
                Home
              </Link>
              <Link
                href={dashboardHref}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100">
                {dashboardLabel}
              </Link>
            </div>
          </details>
        </div>
      </nav>
      <PricingBackButton />

      <section className="relative mx-auto w-full max-w-7xl px-4 pb-16 pt-4 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Upgrade Plan
          </h1>
        </div>

        <div className="mx-auto mt-6 max-w-5xl">
          <PricingStatusBanner />
        </div>

        <div className="mx-auto mt-6 grid max-w-5xl gap-5 lg:grid-cols-2">
          {BILLING_PLANS.map((plan) => {
            const isPro = plan.id === "pro";

            return (
              <article
                key={plan.id}
                className={`rounded-3xl border p-4 transition sm:p-5 ${
                  isPro
                    ? "border-emerald-400/60 bg-gradient-to-b from-emerald-100 to-white shadow-lg shadow-emerald-200/40"
                    : "border-slate-200 bg-white shadow-md shadow-slate-200/50"
                }`}>
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                    {plan.name}
                  </h2>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      isPro
                        ? "border-emerald-300 bg-emerald-100 text-emerald-700"
                        : "border-slate-300 bg-slate-100 text-slate-700"
                    }`}>
                    {plan.tag}
                  </span>
                </div>

                <p className="mt-4 text-sm text-slate-700 sm:text-base">
                  {plan.description}
                </p>

                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-3xl font-bold text-slate-900 sm:text-4xl">
                    {plan.amountLabel}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-500">
                    Billed Monthly
                  </p>
                </div>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 sm:px-4 sm:py-3 sm:text-sm">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <Check className="h-4 w-4" />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <PricingCheckoutButton
                  planId={plan.id}
                  cta={plan.cta}
                  featured={isPro}
                />
                <p className="mt-3 text-center text-xs text-slate-500">
                  {plan.note}
                </p>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
