import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export async function POST(req: Request) {
  const session = await auth();
  const userEmail = String(session?.user?.email ?? "").trim();
  if (!userEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const currentPassword = String(body.currentPassword ?? "");
  const newPassword = String(body.newPassword ?? "");
  const confirmPassword = String(body.confirmPassword ?? "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.json(
      { error: "Current password, new password, and confirmation are required." },
      { status: 400 },
    );
  }

  if (newPassword.length < 6) {
    return NextResponse.json(
      { error: "New password must be at least 6 characters." },
      { status: 400 },
    );
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json(
      { error: "New password and confirmation do not match." },
      { status: 400 },
    );
  }

  await connectDB();

  const user = await User.findOne({ email: userEmail })
    .select("passwordHash resetToken resetTokenExpiry")
    .lean();

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const existingHash = String(user.passwordHash ?? "");
  if (!existingHash) {
    return NextResponse.json(
      {
        error:
          "This account does not have a password yet. Use Forgot Password to set one first.",
      },
      { status: 400 },
    );
  }

  const isCurrentValid = await bcrypt.compare(currentPassword, existingHash);
  if (!isCurrentValid) {
    return NextResponse.json(
      { error: "Current password is incorrect." },
      { status: 400 },
    );
  }

  const isSameAsCurrent = await bcrypt.compare(newPassword, existingHash);
  if (isSameAsCurrent) {
    return NextResponse.json(
      { error: "New password must be different from current password." },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await User.updateOne(
    { email: userEmail },
    {
      $set: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    },
  );

  return NextResponse.json({ ok: true, message: "Password updated successfully." });
}
