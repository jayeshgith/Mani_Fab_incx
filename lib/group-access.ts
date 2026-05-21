import { connectDB } from "@/lib/db";
import { Group } from "@/models/Group";
import { User } from "@/models/User";

export type GroupAccess = {
  userId: string;
  hasOwnedGroups: boolean;
  isMemberInOtherGroup: boolean;
  canCreateGroup: boolean;
};

export async function getGroupAccessByEmail(
  email: string,
): Promise<GroupAccess | null> {
  await connectDB();

  const user = await User.findOne({ email }).select("_id").lean();
  if (!user?._id) return null;

  const userId = String(user._id);

  const hasOwnedGroups = Boolean(await Group.exists({ ownerId: userId }));
  const isMemberInOtherGroup = Boolean(
    await Group.exists({
      ownerId: { $ne: userId },
      memberIds: userId,
    }),
  );

  return {
    userId,
    hasOwnedGroups,
    isMemberInOtherGroup,
    canCreateGroup: !isMemberInOtherGroup && !hasOwnedGroups,
  };
}
