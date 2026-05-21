"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { familyTransferSchema } from "@/lib/validators/familyTransferSchema";
import { Category } from "@/models/Category";
import { Family } from "@/models/Family";
import { Transaction } from "@/models/Transaction";
import { User } from "@/models/User";
import { getPersonalYearBalanceSummary } from "@/lib/personal-balance";
import { toInrAmount } from "@/lib/society-balance";

export async function createFamilyTransferAction(data: unknown) {
  try {
    const session = await auth();
    const actorEmail = String(session?.user?.email ?? "").trim();
    if (!actorEmail) {
      return { success: false, message: "User not authenticated." };
    }

    const parsed = familyTransferSchema.parse(data);

    await connectDB();

    const actor = await User.findOne({ email: actorEmail })
      .select("_id name email")
      .lean();
    if (!actor?._id) {
      return { success: false, message: "User not found." };
    }

    const actorId = String(actor._id);
    const family = await Family.findOne({
      _id: parsed.familyId,
      ownerId: actorId,
    })
      .select("_id memberIds")
      .lean();
    if (!family?._id) {
      return { success: false, message: "Only family admin can do transfers." };
    }

    const memberIds = Array.isArray(family.memberIds)
      ? family.memberIds.map((id: unknown) => String(id).trim()).filter(Boolean)
      : [];

    if (
      !memberIds.includes(parsed.fromMemberId) ||
      !memberIds.includes(parsed.toMemberId) ||
      parsed.toMemberId === parsed.fromMemberId
    ) {
      return {
        success: false,
        message: "From and To must be valid family members.",
      };
    }

    const participants = await User.find({
      _id: { $in: [parsed.fromMemberId, parsed.toMemberId] },
    })
      .select("_id email name")
      .lean();

    const participantById = new Map(
      participants.map((participant) => [String(participant._id), participant]),
    );

    const fromUser = participantById.get(parsed.fromMemberId);
    const toUser = participantById.get(parsed.toMemberId);
    const fromEmail = String(fromUser?.email ?? "").trim();
    const toEmail = String(toUser?.email ?? "").trim();

    if (!fromEmail || !toEmail) {
      return { success: false, message: "Selected members are invalid." };
    }

    const fromName = String(fromUser?.name ?? fromEmail ?? "Sender").trim();
    const toName = String(toUser?.name ?? toEmail ?? "Receiver").trim();
    const payerDescription = `Paid to ${toName}`;
    const receiverDescription = `Received from ${fromName}`;
    const transferDate = new Date(parsed.transactionDate);
    const transferAmount = Number(parsed.amount);
    const { remaining } = await getPersonalYearBalanceSummary({
      userEmail: fromEmail,
      transactionDate: transferDate,
    });

    if (transferAmount > remaining) {
      return {
        success: false,
        message: `You cannot create this transfer. Remaining family amount for ${fromName} is ${toInrAmount(remaining)}, but entered expense is ${toInrAmount(transferAmount)}.`,
      };
    }

    await Category.findOneAndUpdate(
      {
        name: parsed.category,
        type: "expense",
        scope: parsed.accountScope,
      },
      {
        $setOnInsert: {
          name: parsed.category,
          type: "expense",
          scope: parsed.accountScope,
          isSystem: false,
        },
      },
      { upsert: true },
    );

    await Category.findOneAndUpdate(
      {
        name: parsed.category,
        type: "income",
        scope: parsed.accountScope,
      },
      {
        $setOnInsert: {
          name: parsed.category,
          type: "income",
          scope: parsed.accountScope,
          isSystem: false,
        },
      },
      { upsert: true },
    );

    await Transaction.insertMany([
      {
        userId: fromEmail,
        description: payerDescription,
        amount: transferAmount,
        transactionDate: transferDate,
        category: parsed.category,
        transactionType: "expense",
        accountScope: parsed.accountScope,
        groupId: null,
      },
      {
        userId: toEmail,
        description: receiverDescription,
        amount: transferAmount,
        transactionDate: transferDate,
        category: parsed.category,
        transactionType: "income",
        accountScope: parsed.accountScope,
        groupId: null,
      },
    ]);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/transactions");
    revalidatePath("/family/dashboard");
    revalidatePath(`/family/${parsed.familyId}/transfer`);

    return { success: true, message: "Money transfer created successfully." };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    console.error("Family transfer create error:", error);
    return {
      success: false,
      message,
    };
  }
}
