import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { connectDB } from "@/lib/db";
import { Family } from "@/models/Family";
import { User } from "@/models/User";
import TransferForm from "./transfer-form";

type TransferMember = {
  id: string;
  name: string;
  email: string;
};

export default async function FamilyTransferPage({
  params,
}: {
  params: Promise<{ familyId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const { familyId } = await params;
  await connectDB();

  const owner = await User.findOne({ email: session.user.email })
    .select("_id name email")
    .lean();
  if (!owner?._id || !owner.email) {
    redirect("/family/dashboard");
  }

  const ownerId = String(owner._id);
  const family = await Family.findOne({
    _id: familyId,
    ownerId,
  })
    .select("_id name memberIds")
    .lean();

  if (!family?._id) {
    redirect("/family/dashboard");
  }

  const memberIds = Array.isArray(family.memberIds)
    ? family.memberIds.map((id: unknown) => String(id)).filter(Boolean)
    : [];

  const membersRaw = memberIds.length
    ? await User.find({ _id: { $in: memberIds } })
        .select("_id name email")
        .lean()
    : [];

  const memberById = new Map(
    membersRaw.map((member) => [String(member._id), member]),
  );

  const members: TransferMember[] = memberIds
    .map((id: string) => {
      const member = memberById.get(id);
      if (!member) return null;

      const email = String(member.email ?? "").trim();
      if (!email) return null;

      return {
        id,
        name: String(member.name ?? email),
        email,
      };
    })
    .filter(
      (member: TransferMember | null): member is TransferMember =>
        Boolean(member),
    );

  if (!members.some((member) => member.id === ownerId)) {
    members.unshift({
      id: ownerId,
      name: String(owner.name ?? owner.email),
      email: owner.email,
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 py-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Family Money Transfer</h1>
        <Button variant="outline" asChild>
          <Link href="/family/dashboard">Back to Family Dashboard</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{String(family.name ?? "Family")} - Transfer</CardTitle>
        </CardHeader>
        <CardContent>
          {members.length < 2 ? (
            <p className="text-sm text-slate-600">
              Add at least one other family member before creating a transfer.
            </p>
          ) : (
            <TransferForm
              familyId={String(family._id)}
              adminMemberId={ownerId}
              members={members}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
