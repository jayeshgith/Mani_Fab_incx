import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { Family } from "@/models/Family";
import { User } from "@/models/User";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ familyId: string }> },
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { familyId } = await context.params;
  await connectDB();

  const owner = await User.findOne({ email: session.user.email })
    .select("_id")
    .lean();

  if (!owner?._id) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const ownerId = String(owner._id);

  const family = await Family.findOne({ _id: familyId, ownerId }).lean();
  if (!family) {
    return NextResponse.json(
      { error: "Family not found or access denied." },
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

  const conflictFamily = await Family.findOne({
    _id: { $ne: familyId },
    memberIds: { $in: finalMemberIds },
  })
    .select("_id")
    .lean();

  if (conflictFamily) {
    return NextResponse.json(
      {
        error:
          "One or more selected users already belong to another family. They cannot join multiple families.",
      },
      { status: 409 },
    );
  }

  await Family.updateOne(
    { _id: familyId, ownerId },
    { $set: { memberIds: finalMemberIds } },
  );

  return NextResponse.json({
    ok: true,
    family: {
      id: String(familyId),
      name: String(family.name ?? ""),
      ownerId,
      memberIds: finalMemberIds,
    },
  });
}
