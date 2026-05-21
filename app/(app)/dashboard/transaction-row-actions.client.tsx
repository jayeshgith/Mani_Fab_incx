"use client";

import dynamic from "next/dynamic";

const TransactionRowActionsNoSSR = dynamic(
  () => import("./transaction-row-actions"),
  { ssr: false },
);

type Props = {
  transactionId: string;
  deleteFirst?: boolean;
};

const TransactionRowActionsClient = ({ transactionId, deleteFirst = true }: Props) => {
  return (
    <TransactionRowActionsNoSSR
      transactionId={transactionId}
      deleteFirst={deleteFirst}
    />
  );
};

export default TransactionRowActionsClient;
