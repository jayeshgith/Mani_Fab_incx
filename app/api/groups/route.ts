import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { getGroupAccessByEmail } from "@/lib/group-access";
import { Group } from "@/models/Group";
import { Notification } from "@/models/Notification";
import { User } from "@/models/User";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const groupAccess = await getGroupAccessByEmail(session.user.email);
  if (!groupAccess) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (!groupAccess.canCreateGroup) {
    const errorMessage = groupAccess.hasOwnedGroups
      ? "You already created a society. Delete that society before creating a new one."
      : "You are already a member in another society, so you cannot create a society.";

    return NextResponse.json(
      { error: errorMessage },
      { status: 403 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();
  const rawMemberIds = Array.isArray(body?.memberIds) ? body.memberIds : [];
  const memberIds = rawMemberIds
    .map((id: unknown) => String(id).trim())
    .filter(Boolean);

  if (!name) {
    return NextResponse.json(
      { error: "Society name is required." },
      { status: 400 },
    );
  }

  if (memberIds.length === 0) {
    return NextResponse.json(
      { error: "Add at least one society member to create a society." },
      { status: 400 },
    );
  }

  await connectDB();

  const owner = await User.findOne({ email: session.user.email })
    .select("_id name email")
    .lean();

  if (!owner?._id) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const ownerId = String(owner._id);
  const dedupedMemberIds = [...new Set(memberIds)];
  const validMembers = await User.find({
    _id: { $in: dedupedMemberIds },
  })
    .select("_id")
    .lean();

  const validMemberIds = validMembers.map((member) => String(member._id));

  if (validMemberIds.length === 0) {
    return NextResponse.json(
      { error: "No valid users found for selected members." },
      { status: 400 },
    );
  }

  const finalMemberIds = [...new Set([ownerId, ...validMemberIds])];

  const conflictingGroup = await Group.findOne({
    memberIds: { $in: finalMemberIds },
  })
    .select("_id name")
    .lean();

  if (conflictingGroup) {
    return NextResponse.json(
      {
        error:
          "One or more selected users already belong to another society. They cannot join multiple societies.",
      },
      { status: 409 },
    );
  }

  const createdGroup = await Group.create({
    name,
    ownerId,
    memberIds: finalMemberIds,
  });

  const invitedMemberIds = validMemberIds.filter((memberId) => memberId !== ownerId);

  if (invitedMemberIds.length > 0) {
    const creatorName =
      (typeof owner.name === "string" && owner.name.trim()) ||
      session.user.name ||
      session.user.email ||
      "A user";

    await Notification.insertMany(
      invitedMemberIds.map((memberId) => ({
        userId: memberId,
        title: "Added to Society",
        message: `${creatorName} added you to "${name}" society.`,
        type: "group_invite",
        groupId: String(createdGroup._id),
        isRead: false,
      })),
    );
  }

  return NextResponse.json({
    ok: true,
    group: {
      id: String(createdGroup._id),
      name: createdGroup.name,
      ownerId: createdGroup.ownerId,
      memberIds: createdGroup.memberIds,
    },
  });
}
