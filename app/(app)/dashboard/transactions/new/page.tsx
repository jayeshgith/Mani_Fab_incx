import { Card, CardContent } from "@/components/ui/card";
import { redirect } from "next/navigation";
import NewTransactionForm from "./new-transaction-form";

import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { mergeWithDefaultCategories } from "@/lib/default-categories";
import { Category } from "@/models/Category";
import { Family } from "@/models/Family";
import { Group } from "@/models/Group";
import { User } from "@/models/User";
import type { Category as CategoryType } from "@/types/Category";
import TransactionBreadcrumbs from "../transaction-breadcrumbs";

const NewTransactionPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) => {
  const params = await searchParams;
  const requestedScope: "personal" | "society" | "family" =
    params.scope === "society"
      ? "society"
      : params.scope === "family"
        ? "family"
        : "personal";

  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  await connectDB();

  const currentUser = await User.findOne({ email: session.user.email })
    .select("_id")
    .lean();

  const familyGroupsRaw = currentUser?._id
    ? await Group.find({
        $or: [
          { ownerId: String(currentUser._id) },
          { memberIds: String(currentUser._id) },
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

  const hasFamilyMembership = currentUser?._id
    ? Boolean(
        await Family.findOne({
          $or: [
            { ownerId: String(currentUser._id) },
            { memberIds: String(currentUser._id) },
          ],
        })
          .select("_id")
          .lean(),
      )
    : false;

  const defaultAccountScope: "personal" | "society" | "family" =
    requestedScope === "society" && familyGroups.length > 0
      ? "society"
      : requestedScope === "family" && hasFamilyMembership
        ? "family"
        : "personal";

  const categoriesRaw = await Category.find()
    .select("_id name type scope")
    .sort({ name: 1 })
    .lean();

  const categories: CategoryType[] = mergeWithDefaultCategories(
    categoriesRaw.map((category) => ({
      _id: String(category._id),
      name: category.name,
      type: category.type,
      scope: category.scope,
    })),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <TransactionBreadcrumbs
        scope={requestedScope}
        current="new"
      />

      <Card className="mt-6 w-full max-w-3xl p-4 sm:p-6">
        <CardContent className="pt-6">
          <NewTransactionForm
            familyGroups={familyGroups}
            hasFamilyMembership={hasFamilyMembership}
            categories={categories}
            defaultAccountScope={defaultAccountScope}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default NewTransactionPage;
