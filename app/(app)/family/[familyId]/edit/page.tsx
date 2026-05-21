import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { Family } from "@/models/Family";
import { User } from "@/models/User";
import { redirect } from "next/navigation";
import EditFamilyMembersForm from "./members-form";

type FamilyMember = {
  id: string;
  name: string;
  email: string;
  phone: string;
  image: string;
  isOwner: boolean;
};

export default async function EditFamilyPage({
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
    .select("_id")
    .lean();

  if (!owner?._id) {
    redirect("/dashboard");
  }

  const ownerId = String(owner._id);

  const family = await Family.findOne({ _id: familyId, ownerId }).lean();
  if (!family) {
    redirect("/family/dashboard");
  }

  const memberIds = Array.isArray(family.memberIds)
    ? family.memberIds.map((id: unknown) => String(id))
    : [];

  const users = await User.find({ _id: { $in: memberIds } })
    .select("_id name email phone image")
    .lean();

  const usersById = new Map(users.map((user) => [String(user._id), user]));
  const orderedMembers: FamilyMember[] = memberIds
    .map((id: string) => {
      const user = usersById.get(id);
      if (!user) return null;

      return {
        id,
        name: String(user.name ?? ""),
        email: String(user.email ?? ""),
        phone: String(user.phone ?? ""),
        image: String(user.image ?? ""),
        isOwner: id === ownerId,
      };
    })
    .filter((member: FamilyMember | null): member is FamilyMember =>
      Boolean(member),
    );

  return (
    <EditFamilyMembersForm
      familyId={familyId}
      familyName={String(family.name ?? "Family")}
      initialMembers={orderedMembers}
    />
  );
}
