import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Family } from "@/models/Family";
import { Group } from "@/models/Group";
import { Transaction } from "@/models/Transaction";
import { getPersonalAccountScopeFilter, getFamilyAccountScopeFilter, getSocietyAccountScopeFilter } from "@/lib/account-scope";

const schema = {
  scope: { type: "string", enum: ["personal", "society", "family"] },
  mode: { type: "string", enum: ["month", "week"] },
  year: { type: "number" },
  month: { type: "number" },
};

async function getScopeFilter(scope: string) {
  if (scope === "society") return getSocietyAccountScopeFilter();
  if (scope === "family") return getFamilyAccountScopeFilter();
  return getPersonalAccountScopeFilter({ includeFamily: true });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { scope = "personal", mode = "month", year, month } = body;

  if (!year || !month) {
    return Response.json({ error: "year and month are required" }, { status: 400 });
  }

  const userId = session.user.email;
  await connectDB();

  const currentUser = await User.findOne({ email: userId }).select("name email phone").lean();
  if (!currentUser) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  let matchFilter: Record<string, unknown> = {
    userId,
    ...(await getScopeFilter(scope)),
    transactionDate: { $gte: start, $lt: end },
  };

  if (scope === "society") {
    const currentUserId = await User.findOne({ email: userId }).select("_id").lean();
    if (!currentUserId?._id) return Response.json({ error: "User not found" }, { status: 404 });

    const memberGroups = await Group.find({
      $or: [
        { ownerId: String(currentUserId._id) },
        { memberIds: String(currentUserId._id) },
      ],
    }).select("_id ownerId memberIds").lean();

    const memberUserIds = [...new Set(
      memberGroups.flatMap((g) => {
        const owner = String(g.ownerId ?? "").trim();
        const members = Array.isArray(g.memberIds) ? g.memberIds.map((id: unknown) => String(id).trim()) : [];
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

    if (familyClauses.length === 0) return Response.json({ error: "No society data" }, { status: 404 });
    matchFilter = { ...getSocietyAccountScopeFilter(), $or: familyClauses, transactionDate: { $gte: start, $lt: end } };
  }

  if (scope === "family") {
    matchFilter = {
      userId,
      ...getFamilyAccountScopeFilter(),
      transactionDate: { $gte: start, $lt: end },
    };
  }

  const transactions = await Transaction.find(matchFilter)
    .sort({ transactionDate: -1 })
    .lean();

  const totalIncome = transactions
    .filter((tx) => tx.transactionType === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpenses = transactions
    .filter((tx) => tx.transactionType === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const scopeLabel = scope === "society" ? "Society" : scope === "family" ? "Family" : "Personal";

  return Response.json({
    reportTitle: `Fabinex ${scopeLabel} Report - ${mode === "month" ? "Monthly" : "Weekly"}`,
    userName: currentUser.name || "Unknown",
    userEmail: currentUser.email,
    userPhone: "",
    filters: { scope, mode, year, month },
    summary: {
      totalIncome: totalIncome.toFixed(2),
      totalExpenses: totalExpenses.toFixed(2),
      remaining: (totalIncome - totalExpenses).toFixed(2),
    },
    transactions: transactions.map((tx) => ({
      id: String(tx._id),
      transactionDate: tx.transactionDate,
      description: tx.description,
      transactionType: tx.transactionType,
      category: tx.category,
      amount: tx.amount,
      historyLabel: "",
    })),
    generatedAt: new Date().toLocaleString(),
  });
}
