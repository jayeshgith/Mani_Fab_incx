"use client";

import dynamic from "next/dynamic";

const CashFlowFiltersNoSSR = dynamic(() => import("./cashflow-filters"), {
  ssr: false,
});

type Props = {
  year: number;
  yearsRange: number[];
};

const CashFlowFiltersClient = ({ year, yearsRange }: Props) => {
  return <CashFlowFiltersNoSSR year={year} yearsRange={yearsRange} />;
};

export default CashFlowFiltersClient;
