"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";

type Props = {
  value: "personal" | "society" | "family";
  showSociety: boolean;
  showFamily: boolean;
};

export default function TransactionTypeFilter({
  value,
  showSociety,
  showFamily,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onValueChange(nextValue: "personal" | "society" | "family") {
    const params = new URLSearchParams(searchParams.toString());

    if (nextValue === "personal") {
      params.delete("scope");
    } else {
      params.set("scope", nextValue);
    }

    if (nextValue !== "family") {
      params.delete("familyTxType");
      params.delete("familyTxMonth");
      params.delete("familyTxYear");
      params.delete("familyTxDate");
      params.delete("familyTxRange");
    }

    const query = params.toString();
    router.push(query ? `/dashboard?${query}` : "/dashboard");
  }

  return (
    <div className="w-full sm:w-[180px]">
      <p className="mb-1 text-xs text-slate-500">Transaction Type</p>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="personal">Personal</SelectItem>
          {showSociety ? <SelectItem value="society">Society</SelectItem> : null}
          {showFamily ? <SelectItem value="family">Family</SelectItem> : null}
        </SelectContent>
      </Select>
    </div>
  );
}
