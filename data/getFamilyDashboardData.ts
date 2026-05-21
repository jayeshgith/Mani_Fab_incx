import "server-only";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { getPersonalAccountScopeFilter } from "@/lib/account-scope";
import { Family } from "@/models/Family";
import { Transaction } from "@/models/Transaction";
import { User } from "@/models/User";

type AnnualCashflowItem = {
  month: number;
  totalIncome: number;
  totalExpenses: number;
};

type MemberSummary = {
  id: string;
  name: string;
  email: string;
  phone: string;
  image: string;
  totalIncome: number;
  totalExpenses: number;
};

type RecentTransactionItem = {
  id: string;
  memberName: string;
  memberEmail: string;
  description: string;
  amount: number;
  transactionDate: Date | null;
  category: string;
  transactionType: "income" | "expense";
};

type AggregateRow = {
  _id: {
    month?: number;
    type?: string;
    userId?: string;
  };
  total: number;
};

export type FamilyDashboardData = {
  hasFamily: boolean;
  canManageFamily: boolean;
  familyId: string;
  familyName: string;
  year: number;
  yearsRange: number[];
  annualCashflow: AnnualCashflowItem[];
  memberSummaries: MemberSummary[];
  recentTransactions: RecentTransactionItem[];
};

function buildAnnualCashflow(rows: AggregateRow[]) {
  const result: AnnualCashflowItem[] = [];

  for (let month = 1; month <= 12; month++) {
    const totalIncome =
      rows.find((row) => row._id.month === month && row._id.type === "income")
        ?.total ?? 0;

    const totalExpenses =
      rows.find((row) => row._id.month === month && row._id.type === "expense")
        ?.total ?? 0;

    result.push({
      month,
      totalIncome: Number(totalIncome),
      totalExpenses: Number(totalExpenses),
    });
  }

  return result;
}

function getCategoryName(category: unknown): string {
  if (typeof category === "string" && category.trim()) {
    return category.trim();
  }

  if (category && typeof category === "object" && "name" in category) {
    const name = (category as { name?: string }).name;
    if (typeof name === "string" && name.trim()) {
      return name.trim();
    }
  }

  return "Unknown";
}

function getTransactionType(
  transactionType: unknown,
  category: unknown,
): "income" | "expense" {
  if (transactionType === "income" || transactionType === "expense") {
    return transactionType;
  }

  if (category && typeof category === "object" && "type" in category) {
    const type = (category as { type?: unknown }).type;
    if (type === "income" || type === "expense") {
      return type;
    }
  }

  return "expense";
}

export async function getFamilyDashboardData(params: {
  year?: number;
  recentType?: "all" | "income" | "expense";
  recentMonth?: number;
  recentYear?: number;
  recentDate?: string;
  recentRange?: "all";
}): Promise<FamilyDashboardData | null> {
  const session = await auth();
  if (!session?.user?.email) return null;

  await connectDB();

  const currentUser = await User.findOne({ email: session.user.email })
    .select("_id email")
    .lean();
  if (!currentUser?._id) return null;

  const currentUserId = String(currentUser._id);

  const family = await Family.findOne({ memberIds: currentUserId })
    .select("_id name ownerId memberIds")
    .lean();

  const currentYear = new Date().getFullYear();

  if (!family) {
    return {
      hasFamily: false,
      canManageFamily: false,
      familyId: "",
      familyName: "",
      year: currentYear,
      yearsRange: [currentYear],
      annualCashflow: buildAnnualCashflow([]),
      memberSummaries: [],
      recentTransactions: [],
    };
  }

  const familyId = String(family._id);
  const familyName = String(family.name ?? "Unnamed Family");
  const canManageFamily = String(family.ownerId ?? "") === currentUserId;

  const memberIds = Array.isArray(family.memberIds)
    ? family.memberIds.map((id: unknown) => String(id))
    : [];
  const users = await User.find({ _id: { $in: memberIds } })
    .select("_id name email phone image")
    .lean();

  const memberNameMap = new Map<string, string>();
  const memberIdMap = new Map<string, string>();
  const memberPhoneMap = new Map<string, string>();
  const memberImageMap = new Map<string, string>();

  users.forEach((user) => {
    const email = String(user.email ?? "").trim();
    if (!email) return;

    const userId = String(user._id);
    memberNameMap.set(email, String(user.name ?? user.email ?? "Member"));
    memberIdMap.set(email, userId);
    memberPhoneMap.set(email, String(user.phone ?? ""));
    memberImageMap.set(email, String(user.image ?? ""));
  });

  const familyEmails = Array.from(memberNameMap.keys());
  if (!familyEmails.includes(session.user.email)) {
    familyEmails.push(session.user.email);
    memberNameMap.set(
      session.user.email,
      String(session.user.name ?? session.user.email),
    );
    memberIdMap.set(session.user.email, currentUserId);
    memberPhoneMap.set(session.user.email, "");
    memberImageMap.set(session.user.email, String(session.user.image ?? ""));
  }

  const earliestTransaction = await Transaction.findOne({
    userId: { $in: familyEmails },
    ...getPersonalAccountScopeFilter({ includeFamily: true }),
  })
    .sort({ transactionDate: 1 })
    .select("transactionDate")
    .lean();

  const earliestYear = earliestTransaction?.transactionDate
    ? new Date(earliestTransaction.transactionDate).getFullYear()
    : currentYear;

  const yearsRange = Array.from(
    { length: currentYear - earliestYear + 1 },
    (_, index) => currentYear - index,
  );
  const requestedYear = Number(params.year);
  const year =
    Number.isInteger(requestedYear) && yearsRange.includes(requestedYear)
      ? requestedYear
      : currentYear;

  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

  const annualRows = await Transaction.aggregate<AggregateRow>([
    {
      $match: {
        userId: { $in: familyEmails },
        ...getPersonalAccountScopeFilter({ includeFamily: true }),
        transactionDate: { $gte: start, $lt: end },
      },
    },
    {
      $group: {
        _id: {
          month: { $month: "$transactionDate" },
          type: "$transactionType",
        },
        total: { $sum: "$amount" },
      },
    },
  ]);

  const memberSummaryRows = await Transaction.aggregate<AggregateRow>([
    {
      $match: {
        userId: { $in: familyEmails },
        ...getPersonalAccountScopeFilter({ includeFamily: true }),
        transactionDate: { $gte: start, $lt: end },
      },
    },
    {
      $group: {
        _id: {
          userId: "$userId",
          type: "$transactionType",
        },
        total: { $sum: "$amount" },
      },
    },
  ]);

  const recentDateFilter: { $gte: Date; $lt: Date } | undefined = (() => {
    const rawDate = String(params.recentDate ?? "").trim();
    if (rawDate) {
      const parsedDate = new Date(rawDate);
      if (!Number.isNaN(parsedDate.getTime())) {
        const start = new Date(
          parsedDate.getFullYear(),
          parsedDate.getMonth(),
          parsedDate.getDate(),
        );
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        return { $gte: start, $lt: end };
      }
    }

    const yearFilter = Number(params.recentYear);
    const hasValidYear = Number.isInteger(yearFilter) && yearFilter > 1900;
    const monthFilter = Number(params.recentMonth);
    const hasValidMonth =
      Number.isInteger(monthFilter) && monthFilter >= 1 && monthFilter <= 12;

    if (!hasValidYear) {
      if (hasValidMonth) {
        return undefined;
      }

      if (params.recentRange === "all") {
        return undefined;
      }

      // Default mode: show only the last 2 days on family dashboard.
      const today = new Date();
      const end = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1,
      );
      const start = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - 1,
      );
      return { $gte: start, $lt: end };
    }

    if (hasValidMonth) {
      return {
        $gte: new Date(yearFilter, monthFilter - 1, 1),
        $lt: new Date(yearFilter, monthFilter, 1),
      };
    }

    return {
      $gte: new Date(yearFilter, 0, 1),
      $lt: new Date(yearFilter + 1, 0, 1),
    };
  })();

  const recentFilter: Record<string, unknown> = {
    userId: { $in: familyEmails },
    ...getPersonalAccountScopeFilter({ includeFamily: true }),
  };
  if (params.recentType && params.recentType !== "all") {
    recentFilter.transactionType = params.recentType;
  }
  if (recentDateFilter) {
    recentFilter.transactionDate = recentDateFilter;
  }

  const recentRows = await Transaction.find(recentFilter)
    .sort({ transactionDate: -1 })
    .limit(25)
    .lean();

  const memberSummaries: MemberSummary[] = familyEmails.map((email) => {
    const income =
      memberSummaryRows.find(
        (row) => row._id.userId === email && row._id.type === "income",
      )?.total ?? 0;

    const expenses =
      memberSummaryRows.find(
        (row) => row._id.userId === email && row._id.type === "expense",
      )?.total ?? 0;

    return {
      id: memberIdMap.get(email) ?? email,
      name: memberNameMap.get(email) ?? email,
      email,
      phone: memberPhoneMap.get(email) ?? "",
      image: memberImageMap.get(email) ?? "",
      totalIncome: Number(income),
      totalExpenses: Number(expenses),
    };
  });

  const recentTransactions: RecentTransactionItem[] = recentRows.map((tx) => {
    const memberEmail = String(tx.userId ?? "");
    return {
      id: String(tx._id),
      memberName: memberNameMap.get(memberEmail) ?? memberEmail,
      memberEmail,
      description: String(tx.description ?? ""),
      amount: Number(tx.amount ?? 0),
      transactionDate: tx.transactionDate ? new Date(tx.transactionDate) : null,
      category: getCategoryName(tx.category),
      transactionType: getTransactionType(tx.transactionType, tx.category),
    };
  });

  return {
    hasFamily: true,
    canManageFamily,
    familyId,
    familyName,
    year,
    yearsRange: yearsRange.length ? yearsRange : [currentYear],
    annualCashflow: buildAnnualCashflow(annualRows),
    memberSummaries,
    recentTransactions,
  };
}
