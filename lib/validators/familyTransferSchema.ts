import z from "zod";

export const familyTransferSchema = z
  .object({
    familyId: z.string().min(1, "Missing family id."),
    fromMemberId: z.string().min(1, "Missing sender member id."),
    toMemberId: z.string().min(1, "Please select a receiver."),
    accountScope: z.literal("personal"),
    category: z.literal("Money Transfer"),
    transactionDate: z.coerce.date(),
    amount: z.coerce
      .number()
      .positive("Amount must be greater than zero.")
      .finite("Amount is invalid."),
  })
  .refine((value) => value.fromMemberId !== value.toMemberId, {
    path: ["toMemberId"],
    message: "Receiver must be different from sender.",
  });
