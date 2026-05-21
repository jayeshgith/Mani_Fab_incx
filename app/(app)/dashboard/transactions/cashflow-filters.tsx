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
import { useRouter } from "next/navigation";

type Props = {
  year: number;
  yearsRange: number[];
};

export default function CashFlowFilters({ year, yearsRange }: Props) {
  const router = useRouter();

  return (
    <Select
      defaultValue={year.toString()}
      onValueChange={(value) => router.push(`/dashboard?cfyear=${value}`)}
    >
      <SelectTrigger className="w-full sm:w-[110px]">
        <SelectValue />
      </SelectTrigger>

      <SelectContent>
        {yearsRange.map((yr) => (
          <SelectItem key={yr} value={yr.toString()}>
            {yr}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
