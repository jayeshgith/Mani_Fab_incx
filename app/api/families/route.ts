import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { getFamilyAccessByEmail } from "@/lib/family-access";
import { Family } from "@/models/Family";
import { User } from "@/models/User";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const familyAccess = await getFamilyAccessByEmail(session.user.email);
  if (!familyAccess) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (!familyAccess.canCreateFamily) {
    return NextResponse.json(
      {
        error:
          "You already belong to a family. Leave that family before creating a new one.",
      },
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
      { error: "Family name is required." },
      { status: 400 },
    );
  }

  if (memberIds.length === 0) {
    return NextResponse.json(
      { error: "Add at least one family member to create a family." },
      { status: 400 },
    );
  }

  await connectDB();

  const owner = await User.findOne({ email: session.user.email })
    .select("_id")
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

  const conflictingFamily = await Family.findOne({
    memberIds: { $in: finalMemberIds },
  })
    .select("_id")
    .lean();

  if (conflictingFamily) {
    return NextResponse.json(
      {
        error:
          "One or more selected users already belong to another family. They cannot join multiple families.",
      },
      { status: 409 },
    );
  }

  const createdFamily = await Family.create({
    name,
    ownerId,
    memberIds: finalMemberIds,
  });

  return NextResponse.json({
    ok: true,
    family: {
      id: String(createdFamily._id),
      name: createdFamily.name,
      ownerId: createdFamily.ownerId,
      memberIds: createdFamily.memberIds,
    },
  });
}
