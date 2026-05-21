import "server-only";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { Group } from "@/models/Group";
import { Transaction } from "@/models/Transaction";
import { User } from "@/models/User";
import {
  getPersonalAccountScopeFilter,
  getSocietyAccountScopeFilter,
  toFormAccountScope,
} from "@/lib/account-scope";

type GroupOption = {
  id: string;
  name: string;
};

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
  accountScope: "personal" | "society" | "family";
  description: string;
  amount: number;
  transactionDate: Date | null;
  category: string;
  transactionType: string;
};

type GroupInsightsResult = {
  ownerName: string;
  ownerEmail: string;
  isMemberOnly: boolean;
  groups: GroupOption[];
  selectedGroupId: string;
  selectedGroupName: string;
  year: number;
  yearsRange: number[];
  personalAnnualCashflow: AnnualCashflowItem[];
  groupAnnualCashflow: AnnualCashflowItem[];
  personalRecentTransactions: RecentTransactionItem[];
  groupRecentTransactions: RecentTransactionItem[];
  memberSummaries: MemberSummary[];
};

type AggregateRow = {
  _id: {
    month?: number;
    type?: string;
    userId?: string;
  };
  total: number;
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

export async function getOwnedGroupInsights(params: {
  year: number;
  groupId?: string;
  recentScope?: "all" | "family";
  recentMonth?: number;
  recentYear?: number;
  recentDate?: string;
  recentRange?: "all";
}): Promise<GroupInsightsResult | null> {
  const session = await auth();
  if (!session?.user?.email) return null;

  await connectDB();

  const owner = await User.findOne({ email: session.user.email })
    .select("_id name email image")
    .lean();

  if (!owner?._id || !owner.email) return null;

  const ownerId = String(owner._id);
  const ownerName =
    (typeof owner.name === "string" && owner.name.trim()) || owner.email;

  const ownedGroups = await Group.find({ ownerId })
    .select("_id name memberIds")
    .sort({ createdAt: -1 })
    .lean();

  const isMemberInOtherGroup = Boolean(
    await Group.exists({
      ownerId: { $ne: ownerId },
      memberIds: ownerId,
    }),
  );

  const groups: GroupOption[] = ownedGroups.map((group) => ({
    id: String(group._id),
    name: String(group.name ?? "Unnamed Society"),
  }));

  if (groups.length === 0) {
    const currentYear = new Date().getFullYear();
    return {
      ownerName,
      ownerEmail: owner.email,
      isMemberOnly: isMemberInOtherGroup,
      groups: [],
      selectedGroupId: "",
      selectedGroupName: "",
      year: currentYear,
      yearsRange: [currentYear],
      personalAnnualCashflow: buildAnnualCashflow([]),
      groupAnnualCashflow: buildAnnualCashflow([]),
      personalRecentTransactions: [],
      groupRecentTransactions: [],
      memberSummaries: [],
    };
  }

  const requestedGroup = ownedGroups.find(
    (group) => String(group._id) === params.groupId,
  );
  const selectedGroup = requestedGroup ?? ownedGroups[0];

  const selectedGroupId = String(selectedGroup._id);
  const selectedGroupName = String(selectedGroup.name ?? "Unnamed Society");

  const memberIds = Array.isArray(selectedGroup.memberIds)
    ? selectedGroup.memberIds.map((id: unknown) => String(id))
    : [];

  const members = await User.find({ _id: { $in: memberIds } })
    .select("_id name email phone image")
    .lean();

  const memberEmailMap = new Map<string, string>();
  const memberNameMap = new Map<string, string>();
  const memberIdMap = new Map<string, string>();
  const memberPhoneMap = new Map<string, string>();
  const memberImageMap = new Map<string, string>();

  members.forEach((member) => {
    const email = String(member.email ?? "");
    const memberId = String(member._id);
    if (!email) return;
    memberEmailMap.set(memberId, email);
    memberNameMap.set(email, String(member.name ?? member.email ?? "Member"));
    memberIdMap.set(email, memberId);
    memberPhoneMap.set(email, String(member.phone ?? ""));
    memberImageMap.set(email, String(member.image ?? ""));
  });

  const groupEmails = members
    .map((member) => String(member.email ?? ""))
    .filter(Boolean);

  if (!groupEmails.includes(owner.email)) {
    groupEmails.push(owner.email);
    memberNameMap.set(owner.email, ownerName);
    memberIdMap.set(owner.email, ownerId);
    memberImageMap.set(owner.email, String(owner.image ?? ""));
  }

  const currentYear = new Date().getFullYear();

  const earliestGroupTransaction = await Transaction.findOne({
    ...getSocietyAccountScopeFilter(),
    groupId: selectedGroupId,
    userId: { $in: groupEmails },
  })
    .sort({ transactionDate: 1 })
    .select("transactionDate")
    .lean();

  const earliestYear = earliestGroupTransaction?.transactionDate
    ? new Date(earliestGroupTransaction.transactionDate).getFullYear()
    : currentYear;

  const yearsRange = Array.from(
    { length: currentYear - earliestYear + 1 },
    (_, index) => currentYear - index,
  );

  const year = yearsRange.includes(params.year) ? params.year : currentYear;
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

  const personalAnnualRows = await Transaction.aggregate<AggregateRow>([
    {
      $match: {
        userId: owner.email,
        ...getPersonalAccountScopeFilter(),
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

  const groupAnnualRows = await Transaction.aggregate<AggregateRow>([
    {
      $match: {
        ...getSocietyAccountScopeFilter(),
        groupId: selectedGroupId,
        userId: { $in: groupEmails },
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
        ...getSocietyAccountScopeFilter(),
        groupId: selectedGroupId,
        userId: { $in: groupEmails },
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

  const groupRecentDateFilter: { $gte: Date; $lt: Date } | undefined = (() => {
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
    const hasValidMonth = Number.isInteger(monthFilter) && monthFilter >= 1 && monthFilter <= 12;

    if (!hasValidYear) {
      if (hasValidMonth) {
        return undefined;
      }

      if (params.recentRange === "all") {
        return undefined;
      }

      // Default mode: show only the last 3 days on society dashboard.
      const today = new Date();
      const end = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1,
      );
      const start = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - 2,
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

  const familyRecentClause = {
    ...getSocietyAccountScopeFilter(),
    groupId: selectedGroupId,
    userId: { $in: groupEmails },
  };

  const groupRecentFilter: Record<string, unknown> = {
    ...familyRecentClause,
  };

  if (groupRecentDateFilter) {
    groupRecentFilter.transactionDate = groupRecentDateFilter;
  }

  const groupRecentRows = await Transaction.find(groupRecentFilter)
    .sort({ transactionDate: -1 })
    .limit(25)
    .lean();

  const personalRecentRows = await Transaction.find({
    userId: owner.email,
    ...getPersonalAccountScopeFilter(),
  })
    .sort({ transactionDate: -1 })
    .limit(10)
    .lean();

  const memberSummaries: MemberSummary[] = groupEmails.map((email) => {
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

  const groupRecentTransactions: RecentTransactionItem[] = groupRecentRows.map(
    (transaction) => {
      const memberEmail = String(transaction.userId ?? "");

      return {
        id: String(transaction._id),
        memberName: memberNameMap.get(memberEmail) ?? memberEmail,
        memberEmail,
        accountScope: toFormAccountScope(
          transaction.accountScope,
          transaction.groupId,
        ),
        description: String(transaction.description ?? ""),
        amount: Number(transaction.amount ?? 0),
        transactionDate: transaction.transactionDate
          ? new Date(transaction.transactionDate)
          : null,
        category: getCategoryName(transaction.category),
        transactionType: getTransactionType(
          transaction.transactionType,
          transaction.category,
        ),
      };
    },
  );

  const personalRecentTransactions: RecentTransactionItem[] = personalRecentRows.map(
    (transaction) => {
      return {
        id: String(transaction._id),
        memberName: ownerName,
        memberEmail: owner.email,
        accountScope: toFormAccountScope(
          transaction.accountScope,
          transaction.groupId,
        ),
        description: String(transaction.description ?? ""),
        amount: Number(transaction.amount ?? 0),
        transactionDate: transaction.transactionDate
          ? new Date(transaction.transactionDate)
          : null,
        category: getCategoryName(transaction.category),
        transactionType: getTransactionType(
          transaction.transactionType,
          transaction.category,
        ),
      };
    },
  );

  return {
    ownerName,
    ownerEmail: owner.email,
    isMemberOnly: false,
    groups,
    selectedGroupId,
    selectedGroupName,
    year,
    yearsRange: yearsRange.length > 0 ? yearsRange : [currentYear],
    personalAnnualCashflow: buildAnnualCashflow(personalAnnualRows),
    groupAnnualCashflow: buildAnnualCashflow(groupAnnualRows),
    personalRecentTransactions,
    groupRecentTransactions,
    memberSummaries,
  };
}
