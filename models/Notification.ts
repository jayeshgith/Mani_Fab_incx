import { Schema, model, models } from "mongoose";

const NotificationSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    type: {
      type: String,
      default: "group_invite",
      trim: true,
    },
    groupId: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true },
);

export const Notification =
  models.Notification || model("Notification", NotificationSchema);
