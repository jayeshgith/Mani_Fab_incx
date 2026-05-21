"use client";

import TransactionForm from "@/components/transaction-form";
import { transactionFormSchema } from "@/lib/validators/transactionFormSchema";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import z from "zod";
import { updateTransactionAction } from "./actions";

type FamilyGroup = {
  id: string;
  name: string;
};

const EditTransactionForm = ({
  familyGroups,
  hasFamilyMembership = false,
  transaction,
}: {
  familyGroups: FamilyGroup[];
  hasFamilyMembership?: boolean;
  transaction: {
    id: string;
    category: string;
    accountScope: "personal" | "society" | "family";
    groupId: string;
    amount: number;
    description: string;
    transactionDate: Date;
    transactionType?: "income" | "expense";
  };
}) => {
  const router = useRouter();
  const handleSubmit = async (data: z.input<typeof transactionFormSchema>) => {
    const result = await updateTransactionAction({
      id: transaction.id,
      accountScope: data.accountScope,
      transactionType: data.transactionType,
      groupId: data.groupId,
      amount: Number(data.amount),
      category: data.category,
      transactionDate: data.transactionDate,
      description: data.description,
    });

    if (result.success) {
      toast.success("Transaction updated successfully.", { duration: 4000 });
      if (data.accountScope === "society") {
        router.push("/dashboard?scope=society");
        router.refresh();
        return;
      }
      if (data.accountScope === "family") {
        router.push("/dashboard?scope=family");
        router.refresh();
        return;
      }

      router.push(
        "/dashboard/transactions?month=" +
          (new Date().getMonth() + 1) +
          "&year=" +
          new Date().getFullYear(),
      );
      router.refresh();
    } else {
      toast.error("Failed to update transaction.", {
        description: result.message,
        duration: 4000,
      });
    }
  };


  return (
    <TransactionForm
      familyGroups={familyGroups}
      hasFamilyMembership={hasFamilyMembership}
      onsubmit={handleSubmit}
      defaultValues={{
        accountScope: transaction.accountScope,
        transactionType: transaction.transactionType || "income",
        groupId: transaction.groupId ?? "",
        amount: transaction.amount,
        category: transaction.category,
        description: transaction.description,
        transactionDate: new Date(transaction.transactionDate),
      }}
    />
  );
};

export default EditTransactionForm;
