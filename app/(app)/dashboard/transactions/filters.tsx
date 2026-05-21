"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import Link from "next/link";
import { useState } from "react";

const Filters = ({
  year,
  month,
  yearsRange,
  scope = "personal",
}: {
  year?: number;
  month?: number;
  yearsRange: number[];
  scope?: "personal" | "society" | "family";
}) => {
  const [selectedMonth, setSelectedMonth] = useState(
    month ? month.toString() : "all",
  );
  const [selectedYear, setSelectedYear] = useState(
    year ? year.toString() : "all",
  );

  const queryParams = new URLSearchParams();
  if (selectedMonth !== "all") {
    queryParams.set("month", selectedMonth);
  }
  if (selectedYear !== "all") {
    queryParams.set("year", selectedYear);
  }
  if (scope === "society" || scope === "family") {
    queryParams.set("scope", scope);
  }

  const href = queryParams.toString()
    ? `/dashboard/transactions?${queryParams.toString()}`
    : "/dashboard/transactions";

  return (
    <div className="flex w-full flex-wrap gap-2 sm:w-auto">
      <Select
        value={selectedMonth}
        onValueChange={(newValue) => setSelectedMonth(newValue)}
      >
        <SelectTrigger className="w-full sm:w-[170px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Months</SelectItem>
          {Array.from({ length: 12 }, (_, i) => (
            <SelectItem key={i} value={`${i + 1}`}>
              {format(new Date(2025, i, 1), "MMMM")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={selectedYear}
        onValueChange={(newValue) => setSelectedYear(newValue)}
      >
        <SelectTrigger className="w-full sm:w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Years</SelectItem>
          {yearsRange.map((year) => (
            <SelectItem key={year} value={`${year}`}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button asChild className="w-full sm:w-auto">
        <Link href={href}>Go</Link>
      </Button>
    </div>
  );
};

export default Filters;
