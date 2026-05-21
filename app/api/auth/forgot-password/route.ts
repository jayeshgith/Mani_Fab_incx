import { User } from "@/models/User";
import { connectDB } from "@/lib/db";
import crypto from "crypto";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function POST(req: Request) {
  try {
    await connectDB();

    const { email } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return new Response(
        JSON.stringify({
          message:
            "If an account exists with this email, a reset link has been sent.",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetToken = resetTokenHash;
    user.resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    const resetUrl = `${process.env.NEXT_PUBLIC_URL}/reset-password/${resetToken}`;

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You requested to reset your password. Please click the link below to proceed:</p>
          <p>
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #3b82f6, #06b6d4); color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Reset Password
            </a>
          </p>
          <p style="color: #666; font-size: 12px;">
            This link expires in 30 minutes.
          </p>
          <p style="color: #666; font-size: 12px;">
            If you didn't request this, please ignore this email.
          </p>
        </div>
      `,
    };

    try {
      await transporter.verify();
    } catch (verifyErr) {
      console.error("SMTP transporter verification failed:", verifyErr);
      return new Response(
        JSON.stringify({
          error: "SMTP configuration invalid. Check SMTP settings.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const info = await transporter.sendMail(mailOptions);

    let previewUrl: string | null = null;
    try {
      const nodemailerPkg = require("nodemailer");
      if (typeof nodemailerPkg.getTestMessageUrl === "function") {
        previewUrl = nodemailerPkg.getTestMessageUrl(info) || null;
      }
    } catch (e) {
      // ignore
    }

    const responsePayload: any = {
      message: "Password reset link has been sent to your email.",
    };
    if (previewUrl) responsePayload.previewUrl = previewUrl;

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process request" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
