import z from "zod";
import { transactionFormSchema } from "../validators/transactionFormSchema";

export const transactionFormDefaultValues: z.infer<
  typeof transactionFormSchema
> = {
  accountScope: "personal",
  transactionType: "income",
  groupId: "",
  category: "",
  transactionDate: new Date(),
  amount: 0,
  description: "",
};
