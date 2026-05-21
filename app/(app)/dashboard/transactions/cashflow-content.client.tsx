"use client";

import dynamic from "next/dynamic";

const CashFlowContentNoSSR = dynamic(() => import("./cashflow-content"), {
  ssr: false,
});

type CashflowData = {
  month?: number;
  week?: number;
  weekLabel?: string;
  day?: number;
  dayLabel?: string;
  totalIncome: number;
  totalExpenses: number;
};

type Props = {
  data: CashflowData[];
  mode?: "month" | "week" | "day";
  year: number;
};

const CashFlowContentClient = (props: Props) => {
  return <CashFlowContentNoSSR {...props} />;
};

export default CashFlowContentClient;
