import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { Group } from "@/models/Group";
import { Notification } from "@/models/Notification";
import { User } from "@/models/User";

async function getOwnerIdByEmail(email: string) {
  await connectDB();
  const user = await User.findOne({ email }).select("_id").lean();
  return user?._id ? String(user._id) : "";
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ groupId: string }> },
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await context.params;
  const ownerId = await getOwnerIdByEmail(session.user.email);
  if (!ownerId) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();

  if (!name) {
    return NextResponse.json(
      { error: "Society name is required." },
      { status: 400 },
    );
  }

  const updated = await Group.findOneAndUpdate(
    { _id: groupId, ownerId },
    { $set: { name } },
    { new: true },
  ).lean();

  if (!updated) {
    return NextResponse.json(
      { error: "Society not found or access denied." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    group: {
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
  context: { params: Promise<{ groupId: string }> },
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await context.params;
  const ownerId = await getOwnerIdByEmail(session.user.email);
  if (!ownerId) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const deleted = await Group.findOneAndDelete({
    _id: groupId,
    ownerId,
  }).lean();

  if (!deleted) {
    return NextResponse.json(
      { error: "Society not found or access denied." },
      { status: 404 },
    );
  }

  await Notification.deleteMany({ groupId: String(groupId) });

  return NextResponse.json({ ok: true });
}
