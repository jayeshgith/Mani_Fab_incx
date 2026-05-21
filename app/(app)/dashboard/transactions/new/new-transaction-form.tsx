"use client";

import TransactionForm from "@/components/transaction-form";
import type { Category } from "@/types/Category";
import { transactionFormSchema } from "@/lib/validators/transactionFormSchema";
import z from "zod";
import { createTransactionAction } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type FamilyGroup = {
  id: string;
  name: string;
};

const NewTransactionForm = ({
  familyGroups,
  hasFamilyMembership = false,
  categories,
  defaultAccountScope = "personal",
}: {
  familyGroups: FamilyGroup[];
  hasFamilyMembership?: boolean;
  categories: Category[];
  defaultAccountScope?: "personal" | "society" | "family";
}) => {
  const router = useRouter();

  const handleSubmit = async (data: z.input<typeof transactionFormSchema>) => {
    const result = await createTransactionAction({
      accountScope: data.accountScope,
      transactionType: data.transactionType,
      amount: Number(data.amount),
      groupId: data.groupId,
      category: data.category,
      transactionDate: data.transactionDate,
      description: data.description,
    });

    if (result.success) {
      toast.success("Transaction created successfully.", { duration: 4000 });

      const month = new Date().getMonth() + 1;
      const year = new Date().getFullYear();
      const scopeParam =
        data.accountScope === "society"
          ? "&scope=society"
          : data.accountScope === "family"
            ? "&scope=family"
            : "";

      router.push(
        `/dashboard/transactions?month=${month}&year=${year}${scopeParam}`,
      );
    } else {
      toast.error("Failed to create transaction.", {
        description: result.message,
        duration: 4000,
      });
    }
  };

  return (
    <TransactionForm
      familyGroups={familyGroups}
      hasFamilyMembership={hasFamilyMembership}
      categories={categories}
      onsubmit={handleSubmit}
      showDynamicTitle
      defaultValues={{
        accountScope: defaultAccountScope,
        groupId: defaultAccountScope === "society" ? familyGroups[0]?.id ?? "" : "",
      }}
    />
  );
};

export default NewTransactionForm;
