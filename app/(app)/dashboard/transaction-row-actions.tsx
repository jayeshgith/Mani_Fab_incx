"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
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
import { deleteTransactionAction } from "./transactions/[transactionId]/actions";

const TransactionRowActions = ({
  transactionId,
  deleteFirst = true,
}: {
  transactionId: string;
  deleteFirst?: boolean;
}) => {
  const router = useRouter();

  const handleDelete = async () => {
    const response = await deleteTransactionAction(transactionId);
    if (!response.success) {
      toast.error("Failed to delete transaction.", {
        description: response.message,
        duration: 3000,
      });
      return;
    }

    toast.success("Transaction deleted successfully.", { duration: 3000 });
    router.refresh();
  };

  const editButton = (
    <Button variant="outline" asChild size="icon" aria-label="Edit Transaction">
      <Link href={`/dashboard/transactions/${transactionId}`}>
        <PencilIcon className="h-4 w-4" />
      </Link>
    </Button>
  );

  const deleteButton = (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="icon" aria-label="Delete Transaction">
          <Trash2Icon className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure you want to delete this transaction?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return (
    <div className="flex justify-end gap-2">
      {deleteFirst ? (
        <>
          {deleteButton}
          {editButton}
        </>
      ) : (
        <>
          {editButton}
          {deleteButton}
        </>
      )}
    </div>
  );
};

export default TransactionRowActions;
