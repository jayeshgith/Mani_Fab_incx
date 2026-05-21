type AvatarInput = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  size?: number;
};

const AVATAR_PALETTES: Array<{ bgStart: string; bgEnd: string; fg: string }> = [
  { bgStart: "#2563eb", bgEnd: "#1d4ed8", fg: "#eff6ff" },
  { bgStart: "#0f766e", bgEnd: "#0d9488", fg: "#f0fdfa" },
  { bgStart: "#7c3aed", bgEnd: "#6d28d9", fg: "#f5f3ff" },
  { bgStart: "#be123c", bgEnd: "#e11d48", fg: "#fff1f2" },
  { bgStart: "#b45309", bgEnd: "#d97706", fg: "#fffbeb" },
  { bgStart: "#334155", bgEnd: "#1e293b", fg: "#f8fafc" },
];

function normalize(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function hashText(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getInitials(name?: string | null, email?: string | null) {
  const cleanName = normalize(name);
  if (cleanName) {
    const parts = cleanName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    const [first = "U", second = ""] = parts[0].slice(0, 2).split("");
    return `${first}${second}`.toUpperCase();
  }

  const handle = normalize(email).split("@")[0] ?? "";
  const chars = handle.replace(/[^a-zA-Z0-9]/g, "").slice(0, 2);
  return chars ? chars.toUpperCase() : "U";
}

export function getGeneratedAvatarUrl({
  name,
  email,
  size = 128,
}: Omit<AvatarInput, "image">) {
  const normalizedSize = Number.isFinite(size)
    ? Math.max(48, Math.min(256, Math.round(size)))
    : 128;
  const seed = `${normalize(name)}|${normalize(email)}` || "user";
  const palette = AVATAR_PALETTES[hashText(seed) % AVATAR_PALETTES.length];
  const initials = getInitials(name, email);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${normalizedSize}" height="${normalizedSize}" viewBox="0 0 ${normalizedSize} ${normalizedSize}" role="img" aria-label="Avatar"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="${palette.bgStart}" /><stop offset="100%" stop-color="${palette.bgEnd}" /></linearGradient></defs><rect width="${normalizedSize}" height="${normalizedSize}" rx="${normalizedSize / 2}" fill="url(#g)" /><text x="50%" y="53%" text-anchor="middle" dominant-baseline="middle" font-family="Arial, Helvetica, sans-serif" font-size="${Math.round(normalizedSize * 0.4)}" font-weight="700" fill="${palette.fg}">${escapeXml(initials)}</text></svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function getUserAvatarUrl({
  image,
  name,
  email,
  size = 128,
}: AvatarInput) {
  const cleanImage = normalize(image);
  if (cleanImage) {
    return cleanImage;
  }
  return getGeneratedAvatarUrl({ name, email, size });
}
