import "server-only";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { Group } from "@/models/Group";
import { Transaction } from "@/models/Transaction";
import { User } from "@/models/User";
import {
  getFamilyAccountScopeFilter,
  getPersonalAccountScopeFilter,
  getSocietyAccountScopeFilter,
} from "@/lib/account-scope";

type TransactionScope = "personal" | "society" | "family";

function getScopeFilter(scope: TransactionScope) {
  if (scope === "society") {
    return getSocietyAccountScopeFilter();
  }

  if (scope === "family") {
    return getFamilyAccountScopeFilter();
  }

  return getPersonalAccountScopeFilter({ includeFamily: true });
}

export async function getAnnualCashflow(
  year: number,
  options?: {
    scope?: TransactionScope;
  },
) {
 
  const session = await auth();

  if (!session?.user) return [];


  const userId = session.user.email!;


  await connectDB();
  const scope = options?.scope ?? "personal";

  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

  let matchFilter: Record<string, unknown> = {
    userId,
    ...getScopeFilter(scope),
    transactionDate: { $gte: start, $lt: end },
  };

  if (scope === "society") {
    const currentUser = await User.findOne({ email: userId }).select("_id").lean();
    if (!currentUser?._id) return [];

    const memberGroups = await Group.find({
      $or: [
        { ownerId: String(currentUser._id) },
        { memberIds: String(currentUser._id) },
      ],
    })
      .select("_id ownerId memberIds")
      .lean();
    const groupIds = memberGroups.map((group) => String(group._id));

    if (groupIds.length === 0) return [];

    const memberUserIds = [...new Set(
      memberGroups.flatMap((group) => {
        const owner = String(group.ownerId ?? "").trim();
        const members = Array.isArray(group.memberIds)
          ? group.memberIds.map((id: unknown) => String(id).trim())
          : [];

        return [owner, ...members].filter(Boolean);
      }),
    )];

    const groupUsers = memberUserIds.length
      ? await User.find({ _id: { $in: memberUserIds } })
          .select("_id email")
          .lean()
      : [];
    const userById = new Map(
      groupUsers.map((member) => [String(member._id), member]),
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

    matchFilter = {
      ...getSocietyAccountScopeFilter(),
      $or: familyClauses,
      transactionDate: { $gte: start, $lt: end },
    };
  }

  if (scope === "family") {
    matchFilter = {
      userId,
      ...getFamilyAccountScopeFilter(),
      transactionDate: { $gte: start, $lt: end },
    };
  }

  const rows = await Transaction.aggregate([
    {
      $match: matchFilter,
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

  const result: {
    month: number;
    totalIncome: number;
    totalExpenses: number;
  }[] = [];

  for (let m = 1; m <= 12; m++) {
    const totalIncome =
      rows.find((r) => r._id.month === m && r._id.type === "income")
        ?.total ?? 0;

    const totalExpenses =
      rows.find((r) => r._id.month === m && r._id.type === "expense")
        ?.total ?? 0;

    result.push({
      month: m,
      totalIncome: Number(totalIncome),
      totalExpenses: Number(totalExpenses),
    });
  }

  return result;
}
