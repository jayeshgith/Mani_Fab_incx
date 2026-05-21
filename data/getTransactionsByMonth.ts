import "server-only";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { Group } from "@/models/Group";
import { Transaction } from "@/models/Transaction";
import { User } from "@/models/User";
import {
  getFamilyAccountScopeFilter,
  getSocietyAccountScopeFilter,
  toAccountScopeLabel,
} from "@/lib/account-scope";

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

export async function getTransactionsByMonth({
  year,
  month,
  scope = "personal",
}: {
  year?: number;
  month?: number;
  scope?: "personal" | "society" | "family";
}) {
 
  const session = await auth();
  const userEmail = String(session?.user?.email ?? "").trim();
  if (!userEmail) return [];

  const userId = userEmail;


  await connectDB();

  const hasYearFilter = Number.isInteger(year);
  const hasMonthFilter = Number.isInteger(month);

  let dateFilter: Record<string, unknown> = {};
  if (hasYearFilter && hasMonthFilter) {
    const start = new Date(year as number, (month as number) - 1, 1);
    const end = new Date(year as number, month as number, 1);
    dateFilter = { transactionDate: { $gte: start, $lt: end } };
  } else if (hasYearFilter) {
    const start = new Date(year as number, 0, 1);
    const end = new Date((year as number) + 1, 0, 1);
    dateFilter = { transactionDate: { $gte: start, $lt: end } };
  } else if (hasMonthFilter) {
    dateFilter = {
      $expr: {
        $eq: [{ $month: "$transactionDate" }, month as number],
      },
    };
  }

  if (scope === "society") {
    const currentUser = await User.findOne({ email: userId }).select("_id").lean();
    if (!currentUser?._id) return [];

    const memberGroups = await Group.find({
      $or: [
        { ownerId: String(currentUser._id) },
        { memberIds: String(currentUser._id) },
      ],
    })
      .select("_id name ownerId memberIds")
      .lean();

    if (memberGroups.length === 0) return [];

    const memberUserIds = [
      ...new Set(
        memberGroups.flatMap((group) => {
          const owner = String(group.ownerId ?? "").trim();
          const members = Array.isArray(group.memberIds)
            ? group.memberIds.map((id: unknown) => String(id).trim())
            : [];

          return [owner, ...members].filter(Boolean);
        }),
      ),
    ];

    const groupUsers = memberUserIds.length
      ? await User.find({ _id: { $in: memberUserIds } })
          .select("_id email name")
          .lean()
      : [];

    const userById = new Map(groupUsers.map((member) => [String(member._id), member]));
    const groupNameById = new Map(
      memberGroups.map((group) => [String(group._id), String(group.name ?? "Society")]),
    );

    const familyClauses = memberGroups
      .map((group) => {
        const ids = [
          String(group.ownerId ?? "").trim(),
          ...(Array.isArray(group.memberIds)
            ? group.memberIds.map((id: unknown) => String(id).trim())
            : []),
        ].filter(Boolean);

        const emails = ids
          .map((id) => String(userById.get(id)?.email ?? "").trim())
          .filter(Boolean);

        if (emails.length === 0) return null;

        return {
          groupId: String(group._id),
          userId: { $in: emails },
        };
      })
      .filter((clause): clause is { groupId: string; userId: { $in: string[] } } =>
        Boolean(clause),
      );

    if (familyClauses.length === 0) return [];

    const memberNameByEmail = new Map(
      groupUsers.map((member) => [
        String(member.email ?? ""),
        String(member.name ?? member.email ?? "Member"),
      ]),
    );

    const transactions = await Transaction.find({
      ...getSocietyAccountScopeFilter(),
      $or: familyClauses,
      ...dateFilter,
    })
      .sort({ transactionDate: -1 })
      .lean();

    return transactions.map((t) => ({
      id: t._id.toString(),
      description: t.description,
      amount: t.amount,
      transactionDate: t.transactionDate,
      category: getCategoryName(t.category),
      transactionType: getTransactionType(t.transactionType, t.category),
      canManage: String(t.userId ?? "") === userId,
      historyLabel:
        groupNameById.get(String(t.groupId ?? "")) ??
        toAccountScopeLabel(t.accountScope, t.groupId),
      memberEmail: String(t.userId ?? ""),
      memberName:
        memberNameByEmail.get(String(t.userId ?? "")) ??
        String(t.userId ?? "Member"),
    }));
  }

  if (scope === "family") {
    const transactions = await Transaction.find({
      userId,
      ...getFamilyAccountScopeFilter(),
      ...dateFilter,
    })
      .sort({ transactionDate: -1 })
      .lean();

    return transactions.map((t) => ({
      id: t._id.toString(),
      description: t.description,
      amount: t.amount,
      transactionDate: t.transactionDate,
      category: getCategoryName(t.category),
      transactionType: getTransactionType(t.transactionType, t.category),
      canManage: String(t.userId ?? "") === userId,
      historyLabel: toAccountScopeLabel(t.accountScope, t.groupId),
      memberEmail: "",
      memberName: "",
    }));
  }

  const currentUser = await User.findOne({ email: userId }).select("_id").lean();
  const currentUserId = currentUser?._id ? String(currentUser._id) : "";
  const activeGroupIds = currentUserId
    ? (
        await Group.find({
          $or: [{ ownerId: currentUserId }, { memberIds: currentUserId }],
        })
          .select("_id")
          .lean()
      ).map((group) => String(group._id))
    : [];

  const personalScopeClauses: Record<string, unknown>[] = [
    { accountScope: "personal" },
    { accountScope: { $exists: false } },
    getFamilyAccountScopeFilter(),
  ];

  if (activeGroupIds.length > 0) {
    personalScopeClauses.push({
      accountScope: { $in: ["family", "society"] },
      groupId: { $in: activeGroupIds },
    });
  }

  const transactions = await Transaction.find({
    userId,
    $or: personalScopeClauses,
    ...dateFilter,
  })
    .sort({ transactionDate: -1 })
    .lean();

  const ownTransactions = transactions.filter(
    (transaction) => String(transaction.userId ?? "").trim() === userId,
  );

  return ownTransactions.map((t) => ({
    id: t._id.toString(),
    description: t.description,
    amount: t.amount,
    transactionDate: t.transactionDate,
    category: getCategoryName(t.category),
    transactionType: getTransactionType(t.transactionType, t.category),
    canManage: String(t.userId ?? "") === userId,
    historyLabel: toAccountScopeLabel(t.accountScope, t.groupId),
    memberEmail: "",
    memberName: "",
  }));
}
