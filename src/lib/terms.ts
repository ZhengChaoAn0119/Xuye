export const TERMS_VERSION = "2026-10-05";
export const TERMS_COOKIE = "xuye-terms-intent";

export function hasAcceptedTerms(value: {
  termsVersion?: string | null;
  termsAcceptedAt?: unknown;
}) {
  return value.termsVersion === TERMS_VERSION && Boolean(value.termsAcceptedAt);
}

export function consentUrl(callbackUrl: string) {
  return `/consent?callbackUrl=${encodeURIComponent(callbackUrl)}` as const;
}
