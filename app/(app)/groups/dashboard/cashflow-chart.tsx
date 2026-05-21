"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import numeral from "numeral";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from "recharts";

type CashflowItem = {
  month: number;
  totalIncome: number;
  totalExpenses: number;
};

type CashflowChartProps = {
  title: string;
  annualCashflow: CashflowItem[];
};

function getMonthLabel(month: number) {
  return new Date(2000, Math.max(0, month - 1), 1).toLocaleString("en-US", {
    month: "short",
  });
}

function getMonthLongLabel(month: number) {
  return new Date(2000, Math.max(0, month - 1), 1).toLocaleString("en-US", {
    month: "long",
  });
}

export default function CashflowChart({
  title,
  annualCashflow,
}: CashflowChartProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const onChange = () => setIsMobile(media.matches);

    onChange();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    }

    media.addListener(onChange);
    return () => media.removeListener(onChange);
  }, []);

  const totalIncome = annualCashflow.reduce(
    (sum, item) => sum + item.totalIncome,
    0,
  );
  const totalExpenses = annualCashflow.reduce(
    (sum, item) => sum + item.totalExpenses,
    0,
  );
  const balance = totalIncome - totalExpenses;

  return (
    <div className="space-y-4 rounded-2xl border bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold">{title}</h3>

      <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
        <ChartContainer
          config={{
            totalIncome: { label: "Income", color: "#22c55e" },
            totalExpenses: { label: "Expenses", color: "#f97316" },
          }}
          className="aspect-auto h-[240px] w-full sm:h-[280px]"
        >
          <BarChart data={annualCashflow}>
            <CartesianGrid vertical={false} />
            <YAxis
              tickFormatter={(value) =>
                `${numeral(Number(value)).format(isMobile ? "0.[0]a" : "0a").toUpperCase()}`
              }
              width={isMobile ? 44 : 56}
            />
            <XAxis tickFormatter={(value) => getMonthLabel(Number(value))} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    const month = Number(payload?.[0]?.payload?.month ?? 1);
                    return <span>{getMonthLongLabel(month)}</span>;
                  }}
                />
              }
            />
            <Legend
              verticalAlign={isMobile ? "bottom" : "top"}
              align={isMobile ? "center" : "right"}
              height={isMobile ? 22 : 30}
            />
            <Bar dataKey="totalIncome" fill="var(--color-totalIncome)" radius={4} />
            <Bar
              dataKey="totalExpenses"
              fill="var(--color-totalExpenses)"
              radius={4}
            />
          </BarChart>
        </ChartContainer>

        <div className="flex flex-col justify-center gap-3 rounded-xl border bg-slate-50 p-3">
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">Income</p>
            <p className="text-lg font-semibold text-slate-900">
              INR {numeral(totalIncome).format("0,0[.]00")}
            </p>
          </div>
          <div className="h-px bg-slate-200" />
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">Expenses</p>
            <p className="text-lg font-semibold text-slate-900">
              INR {numeral(totalExpenses).format("0,0[.]00")}
            </p>
          </div>
          <div className="h-px bg-slate-200" />
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">Balance</p>
            <p
              className={`text-lg font-semibold ${
                balance >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              INR {numeral(balance).format("0,0[.]00")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
