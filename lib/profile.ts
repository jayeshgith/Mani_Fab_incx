function hasValue(value: string | null | undefined) {
  return Boolean(value && value.trim().length > 0);
}

export function normalizePhoneNumber(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\D/g, "");
}

export function isValidTenDigitPhoneNumber(value: string) {
  return /^\d{10}$/.test(value);
}

// Backward-compatible export for existing imports.
export function isValidInternationalPhoneNumber(value: string) {
  return isValidTenDigitPhoneNumber(value);
}

export function isProfileComplete(profile: {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  image?: string | null;
}) {
  const normalizedPhone = normalizePhoneNumber(profile.phone ?? "");
  return (
    hasValue(profile.name) &&
    hasValue(profile.email) &&
    isValidTenDigitPhoneNumber(normalizedPhone)
  );
}
