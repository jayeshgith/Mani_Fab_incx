import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { Notification } from "@/models/Notification";
import { User } from "@/models/User";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unread") !== "false";

  await connectDB();

  const user = await User.findOne({ email: session.user.email }).select("_id").lean();
  if (!user?._id) {
    return NextResponse.json({ notifications: [] });
  }

  const notifications = await Notification.find({
    userId: String(user._id),
    ...(unreadOnly ? { isRead: false } : {}),
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return NextResponse.json({
    notifications: notifications.map((notification) => ({
      id: String(notification._id),
      title: notification.title ?? "",
      message: notification.message ?? "",
      isRead: Boolean(notification.isRead),
      type: notification.type ?? "",
      groupId: notification.groupId ?? "",
      createdAt: notification.createdAt,
    })),
  });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const rawIds = Array.isArray(body?.ids) ? body.ids : [];
  const ids = rawIds.map((id: unknown) => String(id).trim()).filter(Boolean);

  await connectDB();

  const user = await User.findOne({ email: session.user.email }).select("_id").lean();
  if (!user?._id) {
    return NextResponse.json({ ok: true });
  }

  if (ids.length === 0) {
    await Notification.updateMany(
      { userId: String(user._id), isRead: false },
      { $set: { isRead: true } },
    );
  } else {
    await Notification.updateMany(
      {
        _id: { $in: ids },
        userId: String(user._id),
      },
      { $set: { isRead: true } },
    );
  }

  return NextResponse.json({ ok: true });
}
