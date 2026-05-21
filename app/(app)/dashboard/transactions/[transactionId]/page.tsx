import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EditTransactionForm from "./edit-transaction-form";
import DeleteTransactionDialog from "./delete-transaction-dialog";
import { format } from "date-fns";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { Family } from "@/models/Family";
import { Group } from "@/models/Group";
import { Transaction } from "@/models/Transaction";
import { User } from "@/models/User";
import { isSocietyAccountScope, toFormAccountScope } from "@/lib/account-scope";

async function canManageAsGroupOwner(params: {
  actorId: string;
  groupId: string;
  transactionUserEmail: string;
}) {
  const group = await Group.findOne({
    _id: params.groupId,
    ownerId: params.actorId,
  })
    .select("ownerId memberIds")
    .lean();

  if (!group) return false;

  const allowedUserIds = [
    String(group.ownerId ?? "").trim(),
    ...(Array.isArray(group.memberIds)
      ? group.memberIds.map((id: unknown) => String(id).trim())
      : []),
  ].filter(Boolean);

  if (allowedUserIds.length === 0) return false;

  const allowedUsers = await User.find({ _id: { $in: allowedUserIds } })
    .select("email")
    .lean();

  const allowedEmails = new Set(
    allowedUsers
      .map((user) => String(user.email ?? "").trim())
      .filter(Boolean),
  );

  return allowedEmails.has(params.transactionUserEmail);
}

async function canManageAsFamilyOwner(params: {
  actorId: string;
  transactionUserEmail: string;
}) {
  const member = await User.findOne({ email: params.transactionUserEmail })
    .select("_id")
    .lean();
  if (!member?._id) return false;

  const family = await Family.findOne({
    ownerId: params.actorId,
    memberIds: String(member._id),
  })
    .select("_id")
    .lean();

  return Boolean(family?._id);
}

const EditTransactionPage = async ({
  params,
}: {
  params: { transactionId: string } | Promise<{ transactionId: string }>;
}) => {
  const resolvedParams = await Promise.resolve(params);
  const transactionId = resolvedParams.transactionId;

  if (!transactionId) return notFound();
  const session = await auth();
  const actorEmail = String(session?.user?.email ?? "").trim();
  if (!actorEmail) return notFound();

  await connectDB();

  const currentUser = await User.findOne({ email: actorEmail })
    .select("_id")
    .lean();
  if (!currentUser?._id) return notFound();

  const tx = await Transaction.findById(transactionId).lean();
  if (!tx) return notFound();

  const transactionUserEmail = String(tx.userId ?? "").trim();
  const isSelfTransaction = transactionUserEmail === actorEmail;
  const isSocietyTransaction = isSocietyAccountScope(tx.accountScope, tx.groupId);
  const canManageByGroupOwnership =
    !isSelfTransaction &&
    isSocietyTransaction &&
    Boolean(tx.groupId) &&
    (await canManageAsGroupOwner({
      actorId: String(currentUser._id),
      groupId: String(tx.groupId),
      transactionUserEmail,
    }));
  const canManageByFamilyOwnership =
    !isSelfTransaction &&
    !isSocietyTransaction &&
    (await canManageAsFamilyOwner({
      actorId: String(currentUser._id),
      transactionUserEmail,
    }));

  if (!isSelfTransaction && !canManageByGroupOwnership && !canManageByFamilyOwnership) {
    return notFound();
  }

  const familyGroupsRaw = currentUser?._id
    ? await Group.find({
        $or: [
          { memberIds: String(currentUser._id) },
          { ownerId: String(currentUser._id) },
        ],
      })
        .select("_id name")
        .sort({ name: 1 })
        .lean()
    : [];

  const familyGroups = familyGroupsRaw.map((group) => ({
    id: String(group._id),
    name: String(group.name ?? "Unnamed Society"),
  }));

  const hasFamilyMembership = Boolean(
    await Family.findOne({
      $or: [
        { ownerId: String(currentUser._id) },
        { memberIds: String(currentUser._id) },
      ],
    })
      .select("_id")
      .lean(),
  );

  const transaction = {
    id: tx._id.toString(),
    amount: tx.amount,
    description: tx.description,
    transactionDate: tx.transactionDate,
    accountScope: toFormAccountScope(tx.accountScope, tx.groupId),
    groupId: tx.groupId ? String(tx.groupId) : "",
    category:
      typeof tx.category === "string" && tx.category.trim()
        ? tx.category.trim()
        : tx.category && typeof tx.category === "object" && "name" in tx.category
          ? String((tx.category as { name?: string }).name ?? "")
          : "",
    transactionType: tx.transactionType,
  };

  return (
    <div>
      <Card className="mt-8 w-full max-w-3xl p-4 sm:p-6">
        <CardHeader className="text-2xl font-bold">
          <CardTitle className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>Edit Transaction</span>
            <DeleteTransactionDialog
              transactionId={transaction.id}
              transactionDate={format(
                transaction.transactionDate,
                "yyyy-MM-dd",
              )}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EditTransactionForm
            familyGroups={familyGroups}
            hasFamilyMembership={hasFamilyMembership}
            transaction={transaction}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default EditTransactionPage;
