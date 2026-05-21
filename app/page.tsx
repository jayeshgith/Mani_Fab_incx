import Link from "next/link";
import { ArrowRight, TrendingUp, LandmarkIcon } from "lucide-react";
import { auth } from "@/auth";
import AuthButtons from "./auth-buttons";
import { connectDB } from "@/lib/db";
import { getFamilyAccessByEmail } from "@/lib/family-access";
import { getGroupAccessByEmail } from "@/lib/group-access";
import { isProfileComplete } from "@/lib/profile";
import { User } from "@/models/User";
import { redirect } from "next/navigation";

const NEXT_PUBLIC_APP_NAME = `${process.env.NEXT_PUBLIC_APP_NAME || "Fabinex"}`;

export default async function HomePage() {
  const session = await auth();
  let canCreateGroup = false;
  let hasSocietyMembership = false;
  let canCreateFamily = false;
  let hasOwnedFamily = false;
  let hasFamilyMembership = false;

  if (session?.user?.email) {
    await connectDB();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (
      !isProfileComplete({
        name: user?.name ?? "",
        email: session.user.email,
        phone: user?.phone ?? "",
        image: user?.image ?? "",
      })
    ) {
      redirect("/complete-profile");
    }

    const groupAccess = await getGroupAccessByEmail(session.user.email);
    const familyAccess = await getFamilyAccessByEmail(session.user.email);
    canCreateGroup = groupAccess?.canCreateGroup ?? false;
    hasSocietyMembership =
      (groupAccess?.hasOwnedGroups ?? false) ||
      (groupAccess?.isMemberInOtherGroup ?? false);
    canCreateFamily = familyAccess?.canCreateFamily ?? false;
    hasOwnedFamily = familyAccess?.hasOwnedFamily ?? false;
    hasFamilyMembership = familyAccess?.hasFamilyMembership ?? false;
  }

  return (
    <>
      <nav className="relative z-40 bg-primary text-white">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="mr-auto flex items-center gap-2 text-xl font-bold sm:text-2xl">
            <LandmarkIcon className="text-lime-500" />
            {NEXT_PUBLIC_APP_NAME}
          </Link>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/"
              className="rounded-lg border border-white/25 px-3 py-2 text-sm font-semibold hover:bg-white/10">
              Home
            </Link>
            <Link
              href="/pricing"
              className="rounded-lg border border-white/25 px-3 py-2 text-sm font-semibold hover:bg-white/10">
              Upgrade Plan
            </Link>
            {canCreateGroup ? (
              <Link
                href="/groups/new"
                className="rounded-lg border border-white/25 px-3 py-2 text-sm font-semibold hover:bg-white/10">
                Create Society
              </Link>
            ) : null}
            {canCreateFamily ? (
              <Link
                href="/groups/new?mode=family"
                className="rounded-lg border border-white/25 px-3 py-2 text-sm font-semibold hover:bg-white/10">
                Create Family
              </Link>
            ) : null}
            <AuthButtons
              showGroupDashboard={hasSocietyMembership}
              showFamilyDashboard={hasFamilyMembership}
            />
          </div>

          <details className="relative ml-auto md:hidden">
            <summary className="cursor-pointer list-none rounded-lg border border-white/25 px-3 py-2 text-xs font-semibold hover:bg-white/10 [&::-webkit-details-marker]:hidden">
              Menu
            </summary>
            <div className="absolute right-0 top-11 z-50 flex w-64 flex-col gap-2 rounded-xl border border-white/15 bg-slate-950/95 p-3 shadow-2xl">
              <Link
                href="/"
                className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/10">
                Home
              </Link>
              <Link
                href="/pricing"
                className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/10">
                Upgrade Plan
              </Link>
              {canCreateGroup ? (
                <Link
                  href="/groups/new"
                  className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/10">
                  Create Society
                </Link>
              ) : null}
              {canCreateFamily ? (
                <Link
                  href="/groups/new?mode=family"
                  className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/10">
                  Create Family
                </Link>
              ) : null}
              <AuthButtons
                showGroupDashboard={hasSocietyMembership}
                showFamilyDashboard={hasFamilyMembership}
              />
            </div>
          </details>
        </div>
      </nav>

      <main className="relative overflow-hidden bg-slate-950 text-slate-100">
        <div className="pointer-events-none absolute -left-28 top-8 h-72 w-72 rounded-full bg-lime-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-40 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="pointer-events-none absolute left-1/3 top-96 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl" />

        <section className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 pb-16 pt-14 sm:px-8 lg:grid-cols-2 lg:items-center lg:pt-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-lime-300">
              Smart Finance System
            </p>
            <h1 className="mt-6 text-3xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              One place to manage personal and society money.
            </h1>
            <p className="mt-5 max-w-xl text-base text-slate-300 sm:text-lg">
              {NEXT_PUBLIC_APP_NAME} helps you track income and expenses,
              monitor cashflow, and coordinate spending with your society in a
              clear, secure workflow.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {session?.user?.email ? (
                <>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-xl bg-lime-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-lime-400">
                    Open Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href={canCreateGroup ? "/groups/new" : "/groups/dashboard"}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold transition hover:bg-white/10">
                    {canCreateGroup ? "Create Society" : "Society Dashboard"}
                  </Link>
                  <Link
                    href={
                      canCreateFamily
                        ? "/groups/new?mode=family"
                        : hasOwnedFamily
                          ? "/family/dashboard"
                          : hasFamilyMembership
                            ? "/dashboard?scope=family"
                            : "/dashboard"
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold transition hover:bg-white/10">
                    {canCreateFamily ? "Create Family" : "Family Dashboard"}
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 rounded-xl border border-lime-300/30 bg-lime-300/10 px-5 py-3 text-sm font-semibold text-lime-100 transition hover:bg-lime-300/20">
                    Upgrade Plan
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-2 rounded-xl bg-lime-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-lime-400">
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold transition hover:bg-white/10">
                    Sign In
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 rounded-xl border border-lime-300/30 bg-lime-300/10 px-5 py-3 text-sm font-semibold text-lime-100 transition hover:bg-lime-300/20">
                    Upgrade Plan
                  </Link>
                </>
              )}
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-slate-300">
                Expense Tracking
              </span>
              <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-slate-300">
                Society Collaboration
              </span>
              <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-slate-300">
                Real-time Insights
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-white/15 bg-white/5 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
            <p className="text-sm text-slate-300">Cash Flow</p>
            <div className="mt-4 rounded-2xl border border-white/15 bg-slate-900/70 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    This Month
                  </p>
                  <p className="mt-1 text-2xl font-bold text-lime-300">
                    INR 42,500
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-lime-500/15 px-2 py-1 text-xs font-semibold text-lime-300">
                  <TrendingUp className="h-3.5 w-3.5" />
                  +12%
                </span>
              </div>

              <div className="mt-5">
                <div className="relative h-44 rounded-xl border border-white/10 bg-slate-950/70 p-3">
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_top,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:28px_28px]" />
                  <svg
                    viewBox="0 0 360 140"
                    className="relative z-10 h-full w-full"
                    aria-label="Cash flow preview chart">
                    <defs>
                      <linearGradient
                        id="cashflowArea"
                        x1="0%"
                        y1="0%"
                        x2="0%"
                        y2="100%">
                        <stop
                          offset="0%"
                          stopColor="#84cc16"
                          stopOpacity="0.45"
                        />
                        <stop
                          offset="100%"
                          stopColor="#84cc16"
                          stopOpacity="0.03"
                        />
                      </linearGradient>
                    </defs>
                    <path
                      d="M10 118 L50 96 L90 102 L130 80 L170 86 L210 68 L250 74 L290 56 L330 48 L330 130 L10 130 Z"
                      fill="url(#cashflowArea)"
                    />
                    <polyline
                      points="10,118 50,96 90,102 130,80 170,86 210,68 250,74 290,56 330,48"
                      fill="none"
                      stroke="#84cc16"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <polyline
                      points="10,126 50,114 90,117 130,110 170,112 210,106 250,109 290,102 330,98"
                      fill="none"
                      stroke="#fb923c"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.9"
                    />
                  </svg>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                  <span>Jan</span>
                  <span>Mar</span>
                  <span>May</span>
                  <span>Jul</span>
                  <span>Sep</span>
                  <span>Nov</span>
                </div>

                <div className="mt-4 flex items-center gap-4 text-xs">
                  <span className="inline-flex items-center gap-2 text-slate-300">
                    <span className="h-2.5 w-2.5 rounded-full bg-lime-400" />
                    Income Trend
                  </span>
                  <span className="inline-flex items-center gap-2 text-slate-300">
                    <span className="h-2.5 w-2.5 rounded-full bg-orange-400" />
                    Expense Trend
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
