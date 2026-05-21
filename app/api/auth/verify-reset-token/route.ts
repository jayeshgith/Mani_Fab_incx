import { User } from "@/models/User";
import { connectDB } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

   
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

   
    const user = await User.findOne({
      resetToken: tokenHash,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired reset token" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ message: "Token is valid" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Verify token error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to verify token" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
