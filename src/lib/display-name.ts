/** Paid tiers that may choose their own display name. Free has none yet (docs/DECISIONS.md). */
const DISPLAY_NAME_TIERS: readonly string[] = [];

export function canChangeDisplayName(tier: string) {
  return DISPLAY_NAME_TIERS.includes(tier);
}

export const DISPLAY_NAME_LENGTH = { min: 2, max: 20 } as const;

/** Trims, collapses whitespace, and drops control characters; null when the length is invalid. */
export function cleanDisplayName(value: string) {
  const cleaned = value
    .replace(/[\p{Cc}\p{Cf}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  const length = [...cleaned].length;
  return length >= DISPLAY_NAME_LENGTH.min && length <= DISPLAY_NAME_LENGTH.max ? cleaned : null;
}

/**
 * What readers see as their name: the chosen display name, otherwise a shortened email
 * local part ("ai6ru6boy@gmail.com" → "ai6r…") so the address itself is never shown as a title.
 */
export function displayNameFor(user: { name: string | null; email: string | null }) {
  if (user.name?.trim()) return user.name.trim();
  const local = user.email?.split("@")[0] ?? "";
  if (!local) return "讀者";
  return local.length > 4 ? `${[...local].slice(0, 4).join("")}…` : local;
}
