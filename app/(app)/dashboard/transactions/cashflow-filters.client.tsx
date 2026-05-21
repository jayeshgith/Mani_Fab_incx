"use client";

import dynamic from "next/dynamic";

const CashFlowFiltersNoSSR = dynamic(() => import("./cashflow-filters"), {
  ssr: false,
});

type Props = {
  year: number;
  yearsRange: number[];
  mode: "month" | "week" | "day";
};

const CashFlowFiltersClient = ({ year, yearsRange, mode }: Props) => {
  return <CashFlowFiltersNoSSR year={year} yearsRange={yearsRange} mode={mode} />;
};

export default CashFlowFiltersClient;
