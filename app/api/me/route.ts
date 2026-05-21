import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import {
  isProfileComplete,
  isValidTenDigitPhoneNumber,
  normalizePhoneNumber,
} from "@/lib/profile";
import { User } from "@/models/User";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const user = await User.findOne({ email: session.user.email }).lean();

  return NextResponse.json({
    email: session.user.email,
    name: user?.name ?? "",
    image: user?.image ?? "",
    phone: user?.phone ?? "",
    profileCompleted: isProfileComplete({
      name: user?.name ?? "",
      email: session.user.email,
      phone: user?.phone ?? "",
      image: user?.image ?? "",
    }),
  });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const name = String(body.name ?? "").trim();
  const phone = normalizePhoneNumber(body.phone);
  const image = String(body.image ?? "").trim();

  if (
    !isProfileComplete({
      name,
      email: session.user.email,
      phone,
      image,
    })
  ) {
    const phoneError = !isValidTenDigitPhoneNumber(phone)
      ? "Phone number must contain exactly 10 digits."
      : "Name, email, and phone number are required.";

    return NextResponse.json(
      {
        error: phoneError,
      },
      { status: 400 },
    );
  }

  await connectDB();

  const existingUserWithPhone = await User.findOne({
    phone,
    email: { $ne: session.user.email },
  }).lean();

  if (existingUserWithPhone) {
    return NextResponse.json(
      { error: "This phone number is already registered." },
      { status: 409 },
    );
  }

  await User.updateOne(
    { email: session.user.email },
    {
      $set: {
        name,
        image,
        phone,
      },
    },
  );

  return NextResponse.json({ ok: true, profileCompleted: true });
}
