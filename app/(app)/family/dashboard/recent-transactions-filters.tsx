"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  yearsRange: number[];
  type?: "all" | "income" | "expense";
  month?: number;
  year?: number;
  date?: string;
};

const monthOptions = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export default function FamilyRecentTransactionsFilters({
  yearsRange,
  type,
  month,
  year,
  date,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedType, setSelectedType] = useState(type ?? "all");
  const [selectedMonth, setSelectedMonth] = useState(
    month ? String(month) : "all",
  );
  const [selectedYear, setSelectedYear] = useState(year ? String(year) : "all");
  const [selectedDate, setSelectedDate] = useState(date ?? "");

  function onApply() {
    const params = new URLSearchParams(searchParams.toString());
    const isTypeAll = selectedType === "all";
    const isMonthAll = selectedMonth === "all";
    const isYearAll = selectedYear === "all";
    const hasDate = selectedDate.trim().length > 0;
    const isAllHistoryRequest = isTypeAll && isMonthAll && isYearAll && !hasDate;

    if (isTypeAll) {
      params.delete("txType");
    } else {
      params.set("txType", selectedType);
    }

    if (isMonthAll) {
      params.delete("txMonth");
    } else {
      params.set("txMonth", selectedMonth);
    }

    if (isYearAll) {
      params.delete("txYear");
    } else {
      params.set("txYear", selectedYear);
    }

    if (hasDate) {
      params.set("txDate", selectedDate.trim());
    } else {
      params.delete("txDate");
    }

    if (isAllHistoryRequest) {
      params.set("txRange", "all");
    } else {
      params.delete("txRange");
    }

    router.push(`/family/dashboard?${params.toString()}`);
  }

  function onClear() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("txType");
    params.delete("txMonth");
    params.delete("txYear");
    params.delete("txDate");
    params.delete("txRange");

    setSelectedType("all");
    setSelectedMonth("all");
    setSelectedYear("all");
    setSelectedDate("");

    router.push(`/family/dashboard?${params.toString()}`);
  }

  return (
    <div className="flex w-full flex-wrap items-end gap-2">
      <div className="w-full sm:w-[150px]">
        <p className="mb-1 text-xs text-slate-500">Type</p>
        <Select
          value={selectedType}
          onValueChange={(value) =>
            setSelectedType(value as "all" | "income" | "expense")
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-full sm:w-[170px]">
        <p className="mb-1 text-xs text-slate-500">Month</p>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Months</SelectItem>
            {monthOptions.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full sm:w-[120px]">
        <p className="mb-1 text-xs text-slate-500">Year</p>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {yearsRange.map((item) => (
              <SelectItem key={item} value={String(item)}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full sm:w-[170px]">
        <p className="mb-1 text-xs text-slate-500">Date</p>
        <Input
          type="date"
          value={selectedDate}
          onChange={(event) => setSelectedDate(event.target.value)}
        />
      </div>

      <Button type="button" onClick={onApply} className="w-full sm:w-auto">
        Search
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={onClear}
        className="w-full sm:w-auto"
      >
        Clear
      </Button>
    </div>
  );
}
