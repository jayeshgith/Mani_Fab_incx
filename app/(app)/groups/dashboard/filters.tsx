"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";

type GroupFiltersProps = {
  groups: {
    id: string;
    name: string;
  }[];
  selectedGroupId: string;
  year: number;
  yearsRange: number[];
};

export default function GroupFilters({
  groups,
  selectedGroupId,
  year,
  yearsRange,
}: GroupFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateQuery = (nextGroupId: string, nextYear: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("groupId", nextGroupId);
    params.set("year", String(nextYear));
    router.push(`/groups/dashboard?${params.toString()}`);
  };

  return (
    <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
      <Select
        value={selectedGroupId}
        onValueChange={(value) => updateQuery(value, year)}
      >
        <SelectTrigger className="w-full sm:w-[240px]">
          <SelectValue placeholder="Select Society" />
        </SelectTrigger>
        <SelectContent>
          {groups.map((group) => (
            <SelectItem key={group.id} value={group.id}>
              {group.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={String(year)}
        onValueChange={(value) => updateQuery(selectedGroupId, Number(value))}
      >
        <SelectTrigger className="w-full sm:w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {yearsRange.map((yr) => (
            <SelectItem key={yr} value={String(yr)}>
              {yr}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
