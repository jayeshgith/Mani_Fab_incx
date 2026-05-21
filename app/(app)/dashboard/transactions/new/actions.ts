"use server";

import { connectDB } from "@/lib/db";
import { Transaction } from "@/models/Transaction";
import { transactionFormSchema } from "@/lib/validators/transactionFormSchema";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { Group } from "@/models/Group";
import { User } from "@/models/User";
import { Family } from "@/models/Family";
import { Category } from "@/models/Category";
import { toCanonicalStoredAccountScope } from "@/lib/account-scope";
import { getFamilyYearBalanceSummary } from "@/lib/family-balance";
import { getSocietyYearBalanceSummary, toInrAmount } from "@/lib/society-balance";

export const createTransactionAction = async (data: unknown) => {
  try {
    
    const session = await auth();

    if (!session?.user) {
      return { success: false, message: "User not authenticated." };
    }

    const userId = session.user.email!;

    const parsed = transactionFormSchema.parse(data);

    await connectDB();

    const storedAccountScope = toCanonicalStoredAccountScope(
      parsed.accountScope,
      parsed.groupId,
    );
    let groupId: string | null = null;
    let currentUserId = "";

    if (storedAccountScope === "society") {
      const currentUser = await User.findOne({ email: session.user.email })
        .select("_id")
        .lean();
      if (!currentUser?._id) {
        return { success: false, message: "User not found." };
      }
      currentUserId = String(currentUser._id);

      const memberGroups = await Group.find({
        $or: [{ ownerId: currentUserId }, { memberIds: currentUserId }],
      })
        .select("_id")
        .sort({ createdAt: 1 })
        .lean();

      if (memberGroups.length === 0) {
        return {
          success: false,
          message: "No society found for this account.",
        };
      }

      const requestedGroupId = String(parsed.groupId ?? "").trim();
      const selectedGroup =
        memberGroups.find((group) => String(group._id) === requestedGroupId) ??
        memberGroups[0];
      groupId = String(selectedGroup._id);

      if (parsed.transactionType === "expense") {
        const { remaining } = await getSocietyYearBalanceSummary({
          groupId,
          transactionDate: parsed.transactionDate,
        });

        if (parsed.amount > remaining) {
          return {
            success: false,
            message: `You cannot create this transaction. Remaining society amount is ${toInrAmount(remaining)}, but entered expense is ${toInrAmount(parsed.amount)}.`,
          };
        }
      }
    } else if (parsed.transactionType === "expense") {
      const currentUser = await User.findOne({ email: session.user.email })
        .select("_id")
        .lean();
      if (!currentUser?._id) {
        return { success: false, message: "User not found." };
      }

      currentUserId = String(currentUser._id);
      const family = await Family.findOne({
        $or: [{ ownerId: currentUserId }, { memberIds: currentUserId }],
      })
        .select("_id memberIds")
        .lean();

      if (!family?._id && storedAccountScope === "family") {
        return {
          success: false,
          message: "No family found for this account.",
        };
      }

      if (family?._id) {
        const memberIds = Array.isArray(family.memberIds)
          ? family.memberIds
              .map((id: unknown) => String(id).trim())
              .filter(Boolean)
          : [];
        const members = memberIds.length
          ? await User.find({ _id: { $in: memberIds } }).select("email").lean()
          : [];
        const familyEmails = members
          .map((member) => String(member.email ?? "").trim())
          .filter(Boolean);

        if (!familyEmails.includes(userId)) {
          familyEmails.push(userId);
        }

        const { remaining } = await getFamilyYearBalanceSummary({
          memberEmails: familyEmails,
          transactionDate: parsed.transactionDate,
        });

        if (parsed.amount > remaining) {
          return {
            success: false,
            message: `You cannot create this transaction. Remaining family amount is ${toInrAmount(remaining)}, but entered expense is ${toInrAmount(parsed.amount)}.`,
          };
        }
      }
    }

    const categoryScope = parsed.accountScope === "personal" ? "personal" : "family";

    await Category.findOneAndUpdate(
      {
        name: parsed.category,
        type: parsed.transactionType,
        scope: categoryScope,
      },
      {
        $setOnInsert: {
          name: parsed.category,
          type: parsed.transactionType,
          scope: categoryScope,
          isSystem: false,
        },
      },
      { upsert: true },
    );

    const transaction = await Transaction.create({
      userId,
      accountScope: storedAccountScope,
      groupId,
      transactionType: parsed.transactionType,
      amount: parsed.amount,
      description: parsed.description,
      transactionDate: parsed.transactionDate,
      category: parsed.category,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/transactions");
    revalidatePath("/groups/dashboard");
    revalidatePath("/family/dashboard");

    return {
      success: true,
      transactionId: transaction._id.toString(),
      message: "Transaction created successfully.",
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    console.error("Create transaction error:", error);
    return {
      success: false,
      message,
    };
  }
};
