"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import numeral from "numeral";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from "recharts";
import { useRouter, useSearchParams } from "next/navigation";

type CashflowData = {
  month?: number;
  week?: number;
  weekLabel?: string;
  day?: number;
  dayLabel?: string;
  totalIncome: number;
  totalExpenses: number;
};

const CashFlowContent = ({
  data,
  mode = "month",
  year,
}: {
  data: CashflowData[];
  mode?: "month" | "week" | "day";
  year: number;
}) => {
  const today = new Date();
  const router = useRouter();
  const searchParams = useSearchParams();

  const totalIncome = data.reduce((total, item) => total + item.totalIncome, 0);
  const totalExpenses = data.reduce((total, item) => total + item.totalExpenses, 0);
  const balance = totalIncome - totalExpenses;
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

  const handleBarClick = (entry: CashflowData) => {
    if (mode === "month" && entry.month) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("cfmode", "week");
      params.set("cfmonth", String(entry.month));
      params.delete("cfweek");
      router.push(`/dashboard?${params.toString()}`);
    } else if (mode === "week" && entry.week) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("cfmode", "day");
      params.set("cfweek", String(entry.week));
      router.push(`/dashboard?${params.toString()}`);
    }
  };

  const formatXLabel = (value: number) => {
    if (mode === "month") {
      return format(new Date(today.getFullYear(), value - 1, 1), "MMM");
    }
    if (mode === "week") {
      return `W${value}`;
    }
    return `${value}`;
  };

  const formatTooltipLabel = (_value: string | number, payload: { payload?: CashflowData }[]) => {
    const entry = payload[0]?.payload;
    if (!entry) return "";
    if (mode === "month" && entry.month) {
      return format(new Date(today.getFullYear(), entry.month - 1, 1), "MMMM");
    }
    if (mode === "week" && entry.week) {
      return `Week ${entry.week}`;
    }
    if (mode === "day" && entry.day) {
      const month = Number(searchParams.get("cfmonth")) || today.getMonth() + 1;
      return format(new Date(year, month - 1, entry.day), "dd MMM yyyy");
    }
    return "";
  };

  return (
    <>
      <ChartContainer
        config={{
          totalIncome: {
            label: "Income",
            color: "#84cc16",
          },
          totalExpenses: {
            label: "Expenses",
            color: "#f97316",
          },
        }}
        className="aspect-auto h-[240px] w-full sm:h-[300px]"
      >
        <BarChart
          data={data}
          onClick={(clickData) => {
            const activePayload = (clickData as Record<string, unknown>)?.activePayload as { payload: CashflowData }[] | undefined;
            if (activePayload?.[0]?.payload) {
              handleBarClick(activePayload[0].payload);
            }
          }}
        >
          <CartesianGrid vertical={false} />
          <YAxis
            tickFormatter={(value) => {
              if (isMobile) {
                return `${numeral(Number(value)).format("0.[0]a").toUpperCase()}`;
              }
              return `INR ${numeral(value).format("0,0")}`;
            }}
            width={isMobile ? 44 : 72}
          />
          <XAxis tickFormatter={formatXLabel} />
          <ChartTooltip
            content={
              <ChartTooltipContent labelFormatter={formatTooltipLabel} />
            }
          />
          <Legend
            verticalAlign={isMobile ? "bottom" : "top"}
            align={isMobile ? "center" : "right"}
            height={isMobile ? 22 : 30}
            iconType="circle"
            formatter={(value) => {
              return <span className="capitalize text-primary">{value}</span>;
            }}
          />
          <Bar
            dataKey="totalIncome"
            radius={4}
            minPointSize={(value) =>
              typeof value === "number" && value > 0 ? 3 : 0
            }
            fill="var(--color-totalIncome)"
            className={mode !== "day" ? "cursor-pointer" : ""}
          />
          <Bar
            dataKey="totalExpenses"
            radius={4}
            minPointSize={(value) =>
              typeof value === "number" && value > 0 ? 3 : 0
            }
            fill="var(--color-totalExpenses)"
            className={mode !== "day" ? "cursor-pointer" : ""}
          />
        </BarChart>
      </ChartContainer>
      <div className="flex min-w-0 flex-col justify-center gap-4 border-t pt-4 md:border-l md:border-t-0 md:px-4 md:pt-0">
        <div>
          <span className="text-muted-foreground font-bold text-sm">Income</span>
          <h2 className="break-all text-2xl font-semibold sm:text-3xl">
            INR {numeral(totalIncome).format("0,0[.]00")}
          </h2>
        </div>
        <div className="border-t" />
        <div>
          <span className="text-muted-foreground font-bold text-sm">Expenses</span>
          <h2 className="break-all text-2xl font-semibold sm:text-3xl">
            INR {numeral(totalExpenses).format("0,0[.]00")}
          </h2>
        </div>
        <div className="border-t" />
        <div>
          <span className="text-muted-foreground font-bold text-sm">Balance</span>
          <h2
            className={cn(
              "break-all text-2xl font-semibold sm:text-3xl",
              balance < 0 ? "text-red-600" : "text-green-600",
            )}
          >
            INR {numeral(balance).format("0,0[.]00")}
          </h2>
        </div>
      </div>
    </>
  );
};

export default CashFlowContent;
