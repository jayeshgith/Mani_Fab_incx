import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import ChangePasswordCard from "./change-password-card";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <h1 className="text-2xl font-bold sm:text-3xl">Account Settings</h1>

      <div className="mt-6 rounded-xl border p-4">
        <p className="text-sm text-gray-600">Signed in as</p>
        <p className="mt-1 font-medium">{session.user.name}</p>
        <p className="text-gray-700">{session.user.email}</p>
      </div>

      <div className="mt-6 rounded-xl border p-4">
        <h2 className="text-xl font-semibold">Security</h2>
        <p className="mt-2 text-gray-600 text-sm">
          Change your account password to keep your account secure.
        </p>
        <ChangePasswordCard />
      </div>

      <div className="mt-6 rounded-xl border p-4">
        <h2 className="text-xl font-semibold">Billing</h2>
        <p className="mt-2 text-sm text-gray-600">
          Manage your Base or Pro plan and checkout with Stripe test mode.
        </p>
        <Link
          href="/pricing"
          className="mt-4 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Upgrade Plan
        </Link>
      </div>
    </div>
  );
}
