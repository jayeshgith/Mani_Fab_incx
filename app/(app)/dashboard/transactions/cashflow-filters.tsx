// "use client";

// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { useRouter } from "next/navigation";

// type Props = {
//   year: number;
//   yearsRange: number[];
// };

// const CashFlowFilters = ({ year, yearsRange }: Props) => {
//   const router = useRouter();
//   return (
//     <div>
//       <Select
//         defaultValue={year.toString()}
//         onValueChange={(value) => {
//           router.push(`/dashboard?cfyear=${value}`);
//         }}>
//         <SelectTrigger>
//           <SelectValue />
//         </SelectTrigger>
//         <SelectContent>
//           {yearsRange.map((yr) => (
//             <SelectItem key={yr} value={yr.toString()}>
//               {yr}
//             </SelectItem>
//           ))}
//         </SelectContent>
//       </Select>
//     </div>
//   );
// };

// export default CashFlowFilters;


"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

type Props = {
  year: number;
  yearsRange: number[];
  mode: "month" | "week" | "day";
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function CashFlowFilters({ year, yearsRange, mode }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const month = Number(searchParams.get("cfmonth")) || 0;

  const onYearChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("cfyear", value);
    router.push(`/dashboard?${params.toString()}`);
  };

  const onMonthChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("cfmonth", value);
    router.push(`/dashboard?${params.toString()}`);
  };

  const goBack = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (mode === "day") {
      params.set("cfmode", "week");
      params.delete("cfweek");
    } else if (mode === "week") {
      params.delete("cfmode");
      params.delete("cfmonth");
      params.delete("cfweek");
    }
    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {mode !== "month" ? (
        <Button variant="outline" size="sm" onClick={goBack} className="gap-1">
          <ArrowLeft className="h-3 w-3" />
          Back
        </Button>
      ) : null}

      {mode !== "month" ? (
        <p className="text-sm text-slate-500">
          {MONTHS[month - 1] || ""} {year}
        </p>
      ) : null}

      {mode === "month" ? (
        <Select defaultValue={year.toString()} onValueChange={onYearChange}>
          <SelectTrigger className="w-full sm:w-[110px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {yearsRange.map((yr) => (
              <SelectItem key={yr} value={yr.toString()}>{yr}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      {mode === "week" ? (
        <Select value={month.toString()} onValueChange={onMonthChange}>
          <SelectTrigger className="w-full sm:w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((name, i) => (
              <SelectItem key={i + 1} value={String(i + 1)}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  );
}
