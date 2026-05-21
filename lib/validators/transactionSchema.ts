import { addDays, subYears } from "date-fns";
import z from "zod";

export const transactionSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  description: z
    .string()
    .min(3, "Description must contain at least 3 characters")
    .max(300, "Description must contain a maximum of 300 characters"),
  categoryId: z.number().positive("Category ID is invalid"),
  transactionDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid date format",
    })
    .transform((date) => new Date(date))
    .refine((date) => date >= subYears(new Date(), 100), {
      message: "Date is too far in the past",
    })
    .refine((date) => date <= addDays(new Date(), 1), {
      message: "Date is too far in the future",
    }),
});
