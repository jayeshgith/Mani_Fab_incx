import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 },
      );
    }

    if (String(password).length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }

    await connectDB();

    const exists = await User.findOne({ email }).lean();
    if (exists) {
      return NextResponse.json(
        { message: "Email already registered" },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const name = `${firstName ?? ""} ${lastName ?? ""}`.trim();

    await User.create({
      email,
      name,
      passwordHash,
      image: "",
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message ?? "Something went wrong" },
      { status: 500 },
    );
  }
}
