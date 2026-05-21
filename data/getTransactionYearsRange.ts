import "server-only";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { Group } from "@/models/Group";
import { Transaction } from "@/models/Transaction";
import { User } from "@/models/User";
import {
  getFamilyAccountScopeFilter,
  getSocietyAccountScopeFilter,
} from "@/lib/account-scope";

type TransactionScope = "all" | "personal" | "society" | "family";

export async function getTransactionYearsRange(options?: {
  scope?: TransactionScope;
}) {
  
  const session = await auth();
  const userEmail = String(session?.user?.email ?? "").trim();
  if (!userEmail) return [];

  const userId = userEmail;


  await connectDB();
  const scope = options?.scope ?? "all";
  let scopeFilter: Record<string, unknown> = {};

  if (scope === "society") {
    scopeFilter = getSocietyAccountScopeFilter();
  } else if (scope === "family") {
    scopeFilter = getFamilyAccountScopeFilter();
  } else if (scope === "personal") {
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

    scopeFilter = { $or: personalScopeClauses };
  }

  const earliest = await Transaction.findOne({
    userId,
    ...scopeFilter,
  })
    .sort({ transactionDate: 1 })
    .lean();

  const currentYear = new Date().getFullYear();
  const earliestYear = earliest
    ? new Date(earliest.transactionDate).getFullYear()
    : currentYear;

  return Array.from(
    { length: currentYear - earliestYear + 1 },
    (_, i) => currentYear - i,
  );
}
