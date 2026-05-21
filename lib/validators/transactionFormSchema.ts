import { addDays } from "date-fns";
import z from "zod";

export const transactionFormSchema = z.object({
  accountScope: z.enum(["personal", "society", "family"]),
  transactionType: z.enum(["income", "expense"]),
  groupId: z.string().optional(),
  category: z
    .string()
    .trim()
    .min(1, "Category is required.")
    .max(100, "Category must be at most 100 characters long."),

  transactionDate: z.coerce
    .date()
    .max(
      Number(addDays(new Date(), 1)),
      "Transaction date cannot be in the future.",
    ),
  amount: z.coerce.number().positive("Amount must be a positive number."),
  description: z
    .string()
    .min(3, "Description must be at least 3 characters long.")
    .max(255, "Description must be at most 255 characters long."),
}).superRefine((value, ctx) => {
  if (value.accountScope === "society" && !value.groupId?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["groupId"],
      message: "No society found for this account.",
    });
  }

  if (
    value.accountScope === "family" &&
    !value.groupId?.trim() &&
    value.transactionType !== "expense"
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["transactionType"],
      message: "Family transactions can only be expense.",
    });
  }
});
