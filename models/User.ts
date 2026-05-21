import mongoose, { Schema, models } from "mongoose";

const UserSchema = new Schema(
  {
    email: { type: String, unique: true, required: true },
    name: { type: String, default: "" },
    image: { type: String, default: "" },
    phone: { type: String, default: "" },
    passwordHash: { type: String, default: "" },
    resetToken: { type: String, default: null },
    resetTokenExpiry: { type: Date, default: null },
  },
  { timestamps: true },
);

export const User = models.User || mongoose.model("User", UserSchema);
