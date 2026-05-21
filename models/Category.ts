import { Schema, model, models } from "mongoose";

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["income", "expense"], required: true },
    scope: {
      type: String,
      enum: ["personal", "family", "social"],
      required: true,
      default: "personal",
      index: true,
    },
    isSystem: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { timestamps: true },
);

export const Category = models.Category || model("Category", CategorySchema);
