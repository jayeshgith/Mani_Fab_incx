import { getPersonalAccountScopeFilter } from "@/lib/account-scope";
import { Transaction } from "@/models/Transaction";

type AggregateTypeRow = {
  _id: string;
  total: number;
};

export async function getPersonalYearBalanceSummary(params: {
  userEmail: string;
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
    userId: params.userEmail,
    ...getPersonalAccountScopeFilter({ includeFamily: true }),
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
