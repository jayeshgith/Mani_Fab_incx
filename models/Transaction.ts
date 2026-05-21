import { Schema, model, models } from "mongoose";

const TransactionSchema = new Schema(
  {
    userId: {
      type: String,
      required: true, // Clerk userId
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    transactionDate: {
      type: Date,
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    transactionType: {
      type: String,
      enum: ["income", "expense"],
      required: false,
    },
    accountScope: {
      type: String,
      enum: ["personal", "family", "society"],
      required: true,
      default: "personal",
      index: true,
    },
    groupId: {
      type: String,
      required: false,
      index: true,
      default: null,
    },
  },

  { timestamps: true },
);

const existingTransactionModel = models.Transaction;
if (existingTransactionModel) {
  const accountScopePath = existingTransactionModel.schema.path("accountScope") as {
    options?: { enum?: string[] };
  };
  const enumValues = accountScopePath?.options?.enum ?? [];

  // Refresh stale model when dev server hot-reloads older schema definitions.
  if (!enumValues.includes("society")) {
    delete models.Transaction;
  }
}

export const Transaction =
  models.Transaction || model("Transaction", TransactionSchema);

  
