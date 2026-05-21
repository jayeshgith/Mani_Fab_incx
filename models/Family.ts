import { Schema, model, models } from "mongoose";

const FamilySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    memberIds: {
      type: [String],
      required: true,
      default: [],
    },
  },
  { timestamps: true },
);

export const Family = models.Family || model("Family", FamilySchema);
