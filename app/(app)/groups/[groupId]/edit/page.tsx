import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { Group } from "@/models/Group";
import { User } from "@/models/User";
import { redirect } from "next/navigation";
import EditGroupMembersForm from "./members-form";

type GroupMember = {
  id: string;
  name: string;
  email: string;
  phone: string;
  image: string;
  isOwner: boolean;
};

export default async function EditGroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const { groupId } = await params;
  await connectDB();

  const owner = await User.findOne({ email: session.user.email })
    .select("_id")
    .lean();

  if (!owner?._id) {
    redirect("/dashboard");
  }

  const ownerId = String(owner._id);

  const group = await Group.findOne({ _id: groupId, ownerId }).lean();
  if (!group) {
    redirect("/dashboard");
  }

  const memberIds = Array.isArray(group.memberIds)
    ? group.memberIds.map((id: string) => String(id))
    : [];

  const users = await User.find({ _id: { $in: memberIds } })
    .select("_id name email phone image")
    .lean();

  const usersById = new Map(users.map((user) => [String(user._id), user]));
  const orderedMembers: GroupMember[] = memberIds
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
    .filter((member: GroupMember | null): member is GroupMember =>
      Boolean(member),
    );

  return (
    <EditGroupMembersForm
      groupId={groupId}
      groupName={String(group.name ?? "Society")}
      initialMembers={orderedMembers}
    />
  );
}
