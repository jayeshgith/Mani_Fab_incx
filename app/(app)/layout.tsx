import Link from "next/link";
import { LandmarkIcon, MenuIcon } from "lucide-react";
import AuthButtons from "../auth-buttons";
import NotificationListener from "./notification-listener";
import AppBreadcrumbs from "@/components/app-breadcrumbs";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { getFamilyAccessByEmail } from "@/lib/family-access";
import { getGroupAccessByEmail } from "@/lib/group-access";
import { isProfileComplete } from "@/lib/profile";
import { User } from "@/models/User";
import { redirect } from "next/navigation";

const NEXT_PUBLIC_APP_NAME = `${process.env.NEXT_PUBLIC_APP_NAME || "Fabinex"}`;

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  await connectDB();
  const user = await User.findOne({ email: session.user.email }).lean();
  const groupAccess = await getGroupAccessByEmail(session.user.email);
  const familyAccess = await getFamilyAccessByEmail(session.user.email);
  const hasSocietyMembership =
    (groupAccess?.hasOwnedGroups ?? false) ||
    (groupAccess?.isMemberInOtherGroup ?? false);
  const canCreateGroup = groupAccess?.canCreateGroup ?? false;
  const hasFamilyMembership = familyAccess?.hasFamilyMembership ?? false;
  const canCreateFamily = familyAccess?.canCreateFamily ?? false;

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

  return (
    <>
      <nav className="bg-primary text-white">
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
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg border border-white/25 px-3 py-2 text-xs font-semibold hover:bg-white/10 [&::-webkit-details-marker]:hidden">
              <MenuIcon className="h-4 w-4" />
              Menu
            </summary>
            <div className="absolute right-0 top-12 z-50 flex w-[min(22rem,calc(100vw-2rem))] max-h-[70dvh] flex-col gap-2 overflow-y-auto rounded-xl border border-white/15 bg-slate-950/95 p-3 shadow-2xl">
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
                menuMode="inline"
              />
            </div>
          </details>
        </div>
      </nav>

      <AppBreadcrumbs />
      <NotificationListener />
      <main className="overflow-x-hidden pb-6">{children}</main>
    </>
  );
}
