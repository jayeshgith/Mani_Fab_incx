import "server-only";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { Transaction } from "@/models/Transaction";
import { Group } from "@/models/Group";
import { User } from "@/models/User";
import {
  getFamilyAccountScopeFilter,
  getPersonalAccountScopeFilter,
  getSocietyAccountScopeFilter,
} from "@/lib/account-scope";

type TransactionScope = "personal" | "society" | "family";

function getScopeFilter(scope: TransactionScope) {
  if (scope === "society") return getSocietyAccountScopeFilter();
  if (scope === "family") return getFamilyAccountScopeFilter();
  return getPersonalAccountScopeFilter({ includeFamily: true });
}

export async function getCashflowByMonth(
  year: number,
  month: number,
  options?: { scope?: TransactionScope },
) {
  const session = await auth();
  if (!session?.user) return [];

  const userId = session.user.email!;
  await connectDB();
  const scope = options?.scope ?? "personal";

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

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
    }).select("_id ownerId memberIds").lean();
    const groupIds = memberGroups.map((g) => String(g._id));
    if (groupIds.length === 0) return [];

    const memberUserIds = [...new Set(
      memberGroups.flatMap((g) => {
        const owner = String(g.ownerId ?? "").trim();
        const members = Array.isArray(g.memberIds)
          ? g.memberIds.map((id: unknown) => String(id).trim())
          : [];
        return [owner, ...members].filter(Boolean);
      }),
    )];
    const groupUsers = memberUserIds.length
      ? await User.find({ _id: { $in: memberUserIds } }).select("_id email").lean()
      : [];
    const userById = new Map(groupUsers.map((m) => [String(m._id), m]));

    const familyClauses = memberGroups
      .map((g) => {
        const ids = [String(g.ownerId ?? "").trim(), ...(Array.isArray(g.memberIds) ? g.memberIds.map((id: unknown) => String(id).trim()) : [])].filter(Boolean);
        const emails = ids.map((id) => String(userById.get(id)?.email ?? "").trim()).filter(Boolean);
        if (emails.length === 0) return null;
        return { groupId: String(g._id), userId: { $in: emails } };
      })
      .filter(Boolean);

    if (familyClauses.length === 0) return [];
    matchFilter = { ...getSocietyAccountScopeFilter(), $or: familyClauses, transactionDate: { $gte: start, $lt: end } };
  }

  if (scope === "family") {
    matchFilter = {
      userId,
      ...getFamilyAccountScopeFilter(),
      transactionDate: { $gte: start, $lt: end },
    };
  }

  const rows = await Transaction.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: {
          week: { $ceil: { $divide: [{ $dayOfMonth: "$transactionDate" }, 7] } },
          type: "$transactionType",
        },
        total: { $sum: "$amount" },
      },
    },
  ]);

  const result: {
    week: number;
    weekLabel: string;
    totalIncome: number;
    totalExpenses: number;
  }[] = [];

  for (let w = 1; w <= 5; w++) {
    const totalIncome = rows.find((r) => r._id.week === w && r._id.type === "income")?.total ?? 0;
    const totalExpenses = rows.find((r) => r._id.week === w && r._id.type === "expense")?.total ?? 0;
    result.push({
      week: w,
      weekLabel: `Week ${w}`,
      totalIncome: Number(totalIncome),
      totalExpenses: Number(totalExpenses),
    });
  }

  return result;
}
