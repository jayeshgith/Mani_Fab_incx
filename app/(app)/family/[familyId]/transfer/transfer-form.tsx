"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createFamilyTransferAction } from "./actions";

type MemberOption = {
  id: string;
  name: string;
  email: string;
};

type TransferFormProps = {
  familyId: string;
  adminMemberId: string;
  members: MemberOption[];
};

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function TransferForm({
  familyId,
  adminMemberId,
  members,
}: TransferFormProps) {
  const router = useRouter();
  const [fromMemberId, setFromMemberId] = useState(adminMemberId);
  const [toMemberId, setToMemberId] = useState(
    members.find((member) => member.id !== adminMemberId)?.id ??
      members[0]?.id ??
      "",
  );
  const [transferDate, setTransferDate] = useState(toDateInputValue(new Date()));
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const memberById = useMemo(
    () =>
      new Map(
        members.map((member) => [member.id, member.email]),
      ),
    [members],
  );

  const toOptions = useMemo(
    () => members.filter((member) => member.id !== fromMemberId),
    [fromMemberId, members],
  );

  const safeToMemberId = toOptions.some((member) => member.id === toMemberId)
    ? toMemberId
    : (toOptions[0]?.id ?? "");

  const canSubmit =
    members.length > 1 && !!fromMemberId && !!safeToMemberId && !submitting;

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!fromMemberId) {
      toast.error("Please select sender.");
      return;
    }

    if (!safeToMemberId) {
      toast.error("Please select a receiver.");
      return;
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error("Enter a valid amount greater than zero.");
      return;
    }

    setSubmitting(true);
    const result = await createFamilyTransferAction({
      familyId,
      fromMemberId,
      toMemberId: safeToMemberId,
      accountScope: "personal",
      category: "Money Transfer",
      transactionDate: transferDate,
      amount: parsedAmount,
    });

    if (!result.success) {
      toast.error("Transfer failed.", {
        description: result.message,
      });
      setSubmitting(false);
      return;
    }

    toast.success("Money transfer created successfully.");
    router.push("/family/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="transfer-date">Date</Label>
          <Input
            id="transfer-date"
            type="date"
            value={transferDate}
            max={toDateInputValue(new Date())}
            onChange={(event) => setTransferDate(event.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="account-type">Account Type</Label>
          <Input id="account-type" value="Personal" disabled />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input id="category" value="Money Transfer" disabled />
        </div>

        <div className="space-y-2">
          <Label>From</Label>
          <Select
            value={fromMemberId}
            onValueChange={(value) => {
              setFromMemberId(value);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select sender" />
            </SelectTrigger>
            <SelectContent className="w-full">
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name} ({member.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>To</Label>
          <Select value={safeToMemberId} onValueChange={setToMemberId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select receiver" />
            </SelectTrigger>
            <SelectContent className="w-full">
              {toOptions.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name} ({member.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {safeToMemberId ? (
            <p className="text-xs text-slate-500">
              Receiver: {memberById.get(safeToMemberId) ?? "-"}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Enter amount"
            required
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={!canSubmit}>
          {submitting ? "Transferring..." : "Transfer Money"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/family/dashboard")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
