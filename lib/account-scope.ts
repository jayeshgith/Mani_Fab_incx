export const CANONICAL_SOCIETY_ACCOUNT_SCOPE = "society" as const;
export const CANONICAL_FAMILY_ACCOUNT_SCOPE = "family" as const;

function hasGroupId(groupId: unknown): boolean {
  return String(groupId ?? "").trim().length > 0;
}

// "family" was historically used for society transactions. Those legacy rows
// always include a non-empty groupId. New family-scope rows do not.
export function isSocietyAccountScope(scope: unknown, groupId?: unknown): boolean {
  if (typeof scope !== "string") return false;
  const normalized = scope.trim().toLowerCase();

  if (normalized === CANONICAL_SOCIETY_ACCOUNT_SCOPE) {
    return true;
  }

  return normalized === CANONICAL_FAMILY_ACCOUNT_SCOPE && hasGroupId(groupId);
}

export function isFamilyAccountScope(scope: unknown, groupId?: unknown): boolean {
  if (typeof scope !== "string") return false;
  const normalized = scope.trim().toLowerCase();
  return normalized === CANONICAL_FAMILY_ACCOUNT_SCOPE && !hasGroupId(groupId);
}

export function getSocietyAccountScopeFilter() {
  return {
    $or: [
      { accountScope: CANONICAL_SOCIETY_ACCOUNT_SCOPE },
      {
        accountScope: CANONICAL_FAMILY_ACCOUNT_SCOPE,
        groupId: { $exists: true, $nin: [null, ""] },
      },
    ],
  };
}

export function getFamilyAccountScopeFilter() {
  return {
    accountScope: CANONICAL_FAMILY_ACCOUNT_SCOPE,
    $or: [{ groupId: { $exists: false } }, { groupId: null }, { groupId: "" }],
  };
}

export function getPersonalAccountScopeFilter(options?: {
  includeFamily?: boolean;
}) {
  const clauses: Record<string, unknown>[] = [
    { accountScope: "personal" },
    { accountScope: { $exists: false } },
  ];

  if (options?.includeFamily) {
    clauses.push(getFamilyAccountScopeFilter());
  }

  return {
    $or: clauses,
  };
}

export function toFormAccountScope(
  scope: unknown,
  groupId?: unknown,
): "personal" | "society" | "family" {
  if (isSocietyAccountScope(scope, groupId)) {
    return "society";
  }

  if (isFamilyAccountScope(scope, groupId)) {
    return "family";
  }

  return "personal";
}

export function toAccountScopeLabel(
  scope: unknown,
  groupId?: unknown,
): "Society" | "Family" | "Personal" {
  if (isSocietyAccountScope(scope, groupId)) {
    return "Society";
  }

  if (isFamilyAccountScope(scope, groupId)) {
    return "Family";
  }

  return "Personal";
}

export function toCanonicalStoredAccountScope(
  scope: unknown,
  groupId?: unknown,
): "personal" | typeof CANONICAL_SOCIETY_ACCOUNT_SCOPE | typeof CANONICAL_FAMILY_ACCOUNT_SCOPE {
  if (scope === CANONICAL_SOCIETY_ACCOUNT_SCOPE) {
    return CANONICAL_SOCIETY_ACCOUNT_SCOPE;
  }

  if (scope === CANONICAL_FAMILY_ACCOUNT_SCOPE) {
    // Backward compatibility for stale clients that still send
    // accountScope="family" for society transactions.
    return hasGroupId(groupId)
      ? CANONICAL_SOCIETY_ACCOUNT_SCOPE
      : CANONICAL_FAMILY_ACCOUNT_SCOPE;
  }

  return "personal";
}
