import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getFamilyAccessByEmail } from "@/lib/family-access";
import { normalizePhoneNumber } from "@/lib/profile";
import { Family } from "@/models/Family";
import { User } from "@/models/User";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const familyId = String(searchParams.get("familyId") ?? "").trim();

  const familyAccess = await getFamilyAccessByEmail(session.user.email);
  if (!familyAccess) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (familyId) {
    const ownedFamily = await Family.findOne({
      _id: familyId,
      ownerId: familyAccess.userId,
    })
      .select("_id")
      .lean();

    if (!ownedFamily) {
      return NextResponse.json(
        { error: "Only family creator can add/search members." },
        { status: 403 },
      );
    }
  } else if (!familyAccess.canCreateFamily) {
    return NextResponse.json(
      { error: "You already belong to a family." },
      { status: 403 },
    );
  }

  const rawQuery = String(searchParams.get("query") ?? "").trim();
  const normalizedPhoneQuery = normalizePhoneNumber(rawQuery);

  const currentUser = await User.findOne({ email: session.user.email })
    .select("_id")
    .lean();

  const conflictMemberIds = await Family.find(
    familyId ? { _id: { $ne: familyId } } : {},
  ).distinct("memberIds");

  const idFilter: { $nin: unknown[]; $ne?: unknown } = {
    $nin: conflictMemberIds,
  };
  if (currentUser?._id) {
    idFilter.$ne = currentUser._id;
  }

  const userFilter: Record<string, unknown> = {
    _id: idFilter,
  };

  if (rawQuery) {
    const searchFilters: Record<string, unknown>[] = [
      {
        name: {
          $regex: escapeRegex(rawQuery),
          $options: "i",
        },
      },
    ];

    if (normalizedPhoneQuery) {
      const escapedPhoneQuery = escapeRegex(normalizedPhoneQuery);
      const phonePattern = normalizedPhoneQuery.startsWith("+")
        ? `^${escapedPhoneQuery}`
        : `^\\+?${escapedPhoneQuery}`;

      searchFilters.push({
        phone: {
          $regex: phonePattern,
        },
      });
    }

    userFilter.$or = searchFilters;
  }

  const users = await User.find(userFilter)
    .select("_id name email phone image")
    .sort({ name: 1, email: 1 })
    .limit(rawQuery ? 25 : 100)
    .lean();

  return NextResponse.json({
    users: users.map((user) => ({
      id: String(user._id),
      name: user.name ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      image: user.image ?? "",
    })),
  });
}
