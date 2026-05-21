import { getSocietyAccountScopeFilter } from "@/lib/account-scope";
import { Transaction } from "@/models/Transaction";

type AggregateTypeRow = {
  _id: string;
  total: number;
};

const inrFormatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function toInrAmount(amount: number): string {
  return `INR ${inrFormatter.format(Number(amount) || 0)}`;
}

export async function getSocietyYearBalanceSummary(params: {
  groupId: string;
  transactionDate: Date;
  excludeTransactionId?: string;
}) {
  const transactionDate = new Date(params.transactionDate);
  const year = Number.isNaN(transactionDate.getTime())
    ? new Date().getFullYear()
    : transactionDate.getFullYear();
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

  const matchQuery: Record<string, unknown> = {
    ...getSocietyAccountScopeFilter(),
    groupId: params.groupId,
    transactionDate: { $gte: start, $lt: end },
  };

  if (params.excludeTransactionId) {
    matchQuery._id = { $ne: params.excludeTransactionId };
  }

  const rows = await Transaction.aggregate<AggregateTypeRow>([
    {
      $match: matchQuery,
    },
    {
      $group: {
        _id: "$transactionType",
        total: { $sum: "$amount" },
      },
    },
  ]);

  const income =
    Number(rows.find((row) => row._id === "income")?.total ?? 0) || 0;
  const expenses =
    Number(rows.find((row) => row._id === "expense")?.total ?? 0) || 0;
  const remaining = income - expenses;

  return {
    year,
    income,
    expenses,
    remaining,
  };
}
