import { connectDB } from "@/lib/db";
import { Family } from "@/models/Family";
import { User } from "@/models/User";

export type FamilyAccess = {
  userId: string;
  hasOwnedFamily: boolean;
  hasFamilyMembership: boolean;
  canCreateFamily: boolean;
  familyId: string;
};

export async function getFamilyAccessByEmail(
  email: string,
): Promise<FamilyAccess | null> {
  await connectDB();

  const user = await User.findOne({ email }).select("_id").lean();
  if (!user?._id) return null;

  const userId = String(user._id);
  const ownedFamily = await Family.findOne({ ownerId: userId })
    .select("_id")
    .lean();
  const memberFamily = await Family.findOne({ memberIds: userId })
    .select("_id")
    .lean();

  const hasOwnedFamily = Boolean(ownedFamily);
  const hasFamilyMembership = hasOwnedFamily || Boolean(memberFamily);
  const familyId = String(ownedFamily?._id ?? memberFamily?._id ?? "");

  return {
    userId,
    hasOwnedFamily,
    hasFamilyMembership,
    canCreateFamily: !hasOwnedFamily && !memberFamily,
    familyId,
  };
}
