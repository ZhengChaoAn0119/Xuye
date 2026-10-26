export const TERMS_VERSION = "2026-10-05";
export const TERMS_COOKIE = "xuye-terms-intent";

/** localStorage key: the policy version a visitor's privacy notice was acknowledged for. */
export const POLICY_NOTICE_KEY = "xuye:policy-notice";
/** localStorage key: which account last saw the terms notice, so a later visit counts as continued use. */
export const TERMS_SEEN_KEY = "xuye:terms-seen";

export function hasAcceptedTerms(value: {
  termsVersion?: string | null;
  termsAcceptedAt?: unknown;
}) {
  return value.termsVersion === TERMS_VERSION && Boolean(value.termsAcceptedAt);
}

/** Bound to the account and version, so another account or a newer version starts unseen. */
export function termsSeenMarker(userId: string) {
  return `${TERMS_VERSION}:${userId}`;
}
