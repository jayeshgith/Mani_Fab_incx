import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { Group } from "@/models/Group";
import { Notification } from "@/models/Notification";
import { Transaction } from "@/models/Transaction";
import { User } from "@/models/User";
import { getSocietyAccountScopeFilter } from "@/lib/account-scope";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ groupId: string }> },
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await context.params;
  await connectDB();

  const owner = await User.findOne({ email: session.user.email })
    .select("_id name email")
    .lean();

  if (!owner?._id) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const ownerId = String(owner._id);

  const group = await Group.findOne({ _id: groupId, ownerId }).lean();
  if (!group) {
    return NextResponse.json(
      { error: "Society not found or access denied." },
      { status: 404 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const rawMemberIds = Array.isArray(body?.memberIds) ? body.memberIds : [];
  const incomingMemberIds = rawMemberIds
    .map((id: unknown) => String(id).trim())
    .filter(Boolean);

  const dedupedMemberIds = [...new Set(incomingMemberIds)];
  const validMembers = await User.find({
    _id: { $in: dedupedMemberIds },
  })
    .select("_id")
    .lean();

  const validMemberIds = validMembers.map((member) => String(member._id));
  const finalMemberIds = [...new Set([ownerId, ...validMemberIds])];

  const conflictGroup = await Group.findOne({
    _id: { $ne: groupId },
    memberIds: { $in: finalMemberIds },
  })
    .select("_id")
    .lean();

  if (conflictGroup) {
    return NextResponse.json(
      {
        error:
          "One or more selected users already belong to another society. They cannot join multiple societies.",
      },
      { status: 409 },
    );
  }

  await Group.updateOne(
    { _id: groupId, ownerId },
    { $set: { memberIds: finalMemberIds } },
  );

  const previousMemberIds = Array.isArray(group.memberIds)
    ? group.memberIds.map((id: unknown) => String(id))
    : [];

  const removedMemberIds = previousMemberIds.filter(
    (id: string) => id !== ownerId && !finalMemberIds.includes(id),
  );

  const newlyAddedMemberIds = finalMemberIds.filter(
    (id: string) => id !== ownerId && !previousMemberIds.includes(id),
  );

  if (removedMemberIds.length > 0) {
    const removedMembers = await User.find({ _id: { $in: removedMemberIds } })
      .select("email")
      .lean();
    const removedEmails = removedMembers
      .map((member) => String(member.email ?? "").trim())
      .filter(Boolean);

    if (removedEmails.length > 0) {
      await Transaction.deleteMany({
        ...getSocietyAccountScopeFilter(),
        groupId: String(groupId),
        userId: { $in: removedEmails },
      });
    }
  }

  if (newlyAddedMemberIds.length > 0) {
    const creatorName =
      (typeof owner.name === "string" && owner.name.trim()) ||
      session.user.name ||
      session.user.email ||
      "A user";

    const groupName = String(group.name ?? "Society");

    await Notification.insertMany(
      newlyAddedMemberIds.map((memberId) => ({
        userId: memberId,
        title: "Added to Society",
        message: `${creatorName} added you to "${groupName}" society.`,
        type: "group_invite",
        groupId: String(groupId),
        isRead: false,
      })),
    );
  }

  return NextResponse.json({
    ok: true,
    group: {
      id: String(groupId),
      name: String(group.name ?? ""),
      ownerId,
      memberIds: finalMemberIds,
    },
  });
}
