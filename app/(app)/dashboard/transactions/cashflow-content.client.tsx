"use client";

import dynamic from "next/dynamic";

const CashFlowContentNoSSR = dynamic(() => import("./cashflow-content"), {
  ssr: false,
});

type Props = {
  annualCashflow: {
    month: number;
    totalIncome: number;
    totalExpenses: number;
  }[];
};

const CashFlowContentClient = ({ annualCashflow }: Props) => {
  return <CashFlowContentNoSSR annualCashflow={annualCashflow} />;
};

export default CashFlowContentClient;
