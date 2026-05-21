import { auth } from "@/auth";
import { getFamilyAccessByEmail } from "@/lib/family-access";
import { getGroupAccessByEmail } from "@/lib/group-access";
import { redirect } from "next/navigation";
import CreateGroupForm from "./create-group-form";

export default async function CreateGroupPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const params = await searchParams;
  const mode = params.mode === "family" ? "family" : "society";

  if (mode === "family") {
    const familyAccess = await getFamilyAccessByEmail(session.user.email);
    if (!familyAccess) {
      redirect("/dashboard");
    }

    if (!familyAccess.canCreateFamily) {
      redirect(
        familyAccess.hasOwnedFamily ? "/family/dashboard" : "/dashboard?scope=family",
      );
    }

    return <CreateGroupForm mode={mode} />;
  }

  const groupAccess = await getGroupAccessByEmail(session.user.email);
  if (!groupAccess) {
    redirect("/dashboard");
  }
  if (!groupAccess.canCreateGroup) {
    redirect("/dashboard");
  }

  return <CreateGroupForm mode={mode} />;
}
