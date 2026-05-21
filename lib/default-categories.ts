import type { Category } from "@/types/Category";

type CategoryScope = NonNullable<Category["scope"]>;

type CategorySeed = {
  name: string;
  type: Category["type"];
  scope: CategoryScope;
};

const DEFAULT_CATEGORY_SEEDS: readonly CategorySeed[] = [
  { name: "Salary", type: "income", scope: "personal" },
  { name: "Freelance", type: "income", scope: "personal" },
  { name: "Business Income", type: "income", scope: "personal" },
  { name: "Interest", type: "income", scope: "personal" },
  { name: "Bonus", type: "income", scope: "personal" },
  { name: "Gift Received", type: "income", scope: "personal" },
  { name: "Groceries", type: "expense", scope: "personal" },
  { name: "Rent", type: "expense", scope: "personal" },
  { name: "Utilities", type: "expense", scope: "personal" },
  { name: "Transportation", type: "expense", scope: "personal" },
  { name: "Food & Dining", type: "expense", scope: "personal" },
  { name: "Shopping", type: "expense", scope: "personal" },
  { name: "Healthcare", type: "expense", scope: "personal" },
  { name: "Education", type: "expense", scope: "personal" },
  { name: "Entertainment", type: "expense", scope: "personal" },
  { name: "Travel", type: "expense", scope: "personal" },
  { name: "EMI / Loan", type: "expense", scope: "personal" },
  { name: "Insurance", type: "expense", scope: "personal" },
  { name: "Maintenance Collection", type: "income", scope: "family" },
  { name: "Parking Collection", type: "income", scope: "family" },
  { name: "Late Fee / Penalty", type: "income", scope: "family" },
  { name: "Interest Income", type: "income", scope: "family" },
  { name: "Security Salary", type: "expense", scope: "family" },
  { name: "Cleaning", type: "expense", scope: "family" },
  { name: "Repairs & Maintenance", type: "expense", scope: "family" },
  { name: "Water Bill", type: "expense", scope: "family" },
  { name: "Electricity Bill", type: "expense", scope: "family" },
  { name: "Society Event", type: "expense", scope: "family" },
  { name: "Administration", type: "expense", scope: "family" },
];

const normalizeScope = (scope: unknown): Category["scope"] => {
  return scope === "personal" || scope === "family" || scope === "social"
    ? scope
    : undefined;
};

const normalizeType = (type: unknown): Category["type"] | undefined => {
  return type === "income" || type === "expense" ? type : undefined;
};

const normalizeName = (name: unknown): string => String(name ?? "").trim();

const keyFor = (item: Pick<Category, "name" | "type" | "scope">): string =>
  `${item.type}:${item.scope ?? "all"}:${item.name.toLowerCase()}`;

const buildDefaultCategories = (): Category[] => {
  return DEFAULT_CATEGORY_SEEDS.map((item, index) => ({
    _id: `default-${index + 1}`,
    name: item.name,
    type: item.type,
    scope: item.scope,
  }));
};

export const mergeWithDefaultCategories = (
  categories: Array<
    Partial<Pick<Category, "_id" | "name" | "type" | "scope">> | null | undefined
  >,
): Category[] => {
  const merged = new Map<string, Category>();

  for (const item of buildDefaultCategories()) {
    merged.set(keyFor(item), item);
  }

  for (const item of categories) {
    const type = normalizeType(item?.type);
    const name = normalizeName(item?.name);
    if (!type || !name) {
      continue;
    }

    const normalized: Category = {
      _id: String(item?._id ?? `db-${keyFor({ name, type, scope: item?.scope })}`),
      name,
      type,
      scope: normalizeScope(item?.scope),
    };

    merged.set(keyFor(normalized), normalized);
  }

  return Array.from(merged.values()).sort((a, b) => {
    if (a.type !== b.type) {
      return a.type.localeCompare(b.type);
    }
    if ((a.scope ?? "") !== (b.scope ?? "")) {
      return (a.scope ?? "").localeCompare(b.scope ?? "");
    }
    return a.name.localeCompare(b.name);
  });
};
