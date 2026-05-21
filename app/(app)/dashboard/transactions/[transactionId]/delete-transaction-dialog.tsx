"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2Icon } from "lucide-react";
import { deleteTransactionAction } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const DeleteTransactionDialog = ({
  transactionId,
  transactionDate,
}: {
  transactionId: string;
  transactionDate: string;
}) => {
  const router = useRouter();

  const handleDeleteTransaction = async () => {
    const response = await deleteTransactionAction(transactionId);
    if (!response.success) {
      toast.error("Failed to delete transaction.", {
        description: response.message,
        duration: 3000,
      });
      return;
    }

    toast.success("Transaction deleted successfully.", { duration: 3000 });

    const [year, month] = transactionDate.split("-");
    router.push(`/dashboard/transactions?month=${month}&year=${year}`);
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="icon">
          <Trash2Icon className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure you want to delete the transaction on{" "}
            {new Date(transactionDate).toLocaleDateString()}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. Please confirm if you want to proceed.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button variant="destructive" onClick={handleDeleteTransaction}>
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteTransactionDialog;
