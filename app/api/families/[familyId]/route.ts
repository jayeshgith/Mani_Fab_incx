import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { Family } from "@/models/Family";
import { User } from "@/models/User";

async function getOwnerIdByEmail(email: string) {
  await connectDB();
  const user = await User.findOne({ email }).select("_id").lean();
  return user?._id ? String(user._id) : "";
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ familyId: string }> },
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { familyId } = await context.params;
  const ownerId = await getOwnerIdByEmail(session.user.email);
  if (!ownerId) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();

  if (!name) {
    return NextResponse.json(
      { error: "Family name is required." },
      { status: 400 },
    );
  }

  const updated = await Family.findOneAndUpdate(
    { _id: familyId, ownerId },
    { $set: { name } },
    { new: true },
  ).lean();

  if (!updated) {
    return NextResponse.json(
      { error: "Family not found or access denied." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    family: {
      id: String(updated._id),
      name: String(updated.name ?? ""),
      ownerId: String(updated.ownerId ?? ""),
      memberIds: Array.isArray(updated.memberIds)
        ? updated.memberIds.map((id: unknown) => String(id))
        : [],
    },
  });
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ familyId: string }> },
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { familyId } = await context.params;
  const ownerId = await getOwnerIdByEmail(session.user.email);
  if (!ownerId) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const deleted = await Family.findOneAndDelete({
    _id: familyId,
    ownerId,
  }).lean();

  if (!deleted) {
    return NextResponse.json(
      { error: "Family not found or access denied." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}
