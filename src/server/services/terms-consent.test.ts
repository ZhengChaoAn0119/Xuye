import { describe, expect, it, vi } from "vitest";
import { hasAcceptedTerms, TERMS_VERSION } from "@/lib/terms";
import type { Database } from "@/server/db";
import { acceptTerms, createConsentIntent, validConsentIntent } from "./terms-consent";

const secret = "test-only-secret-for-consent-validation";
const now = new Date("2026-10-05T00:00:00Z");

describe("terms consent", () => {
  it("requires a current version and acceptance time, including for legacy users", () => {
    expect(hasAcceptedTerms({})).toBe(false);
    expect(hasAcceptedTerms({ termsVersion: "old", termsAcceptedAt: now })).toBe(false);
    expect(hasAcceptedTerms({ termsVersion: TERMS_VERSION })).toBe(false);
    expect(hasAcceptedTerms({ termsVersion: TERMS_VERSION, termsAcceptedAt: now })).toBe(true);
  });

  it("binds email consent to the normalized authenticated email and provider", () => {
    const intent = createConsentIntent("nodemailer", "Reader@Example.test", secret, now);
    expect(validConsentIntent(intent, "nodemailer", "reader@example.test", secret, now)).toBe(true);
    expect(validConsentIntent(intent, "nodemailer", "other@example.test", secret, now)).toBe(false);
    expect(validConsentIntent(intent, "google", null, secret, now)).toBe(false);
    expect(Buffer.from(intent.split(".")[0]!, "base64url").toString()).not.toContain(
      "example.test",
    );
  });

  it("rejects tampering, invalid signatures, malformed and expired intents", () => {
    const intent = createConsentIntent("google", null, secret, now);
    expect(validConsentIntent(intent, "google", null, secret, now)).toBe(true);
    for (const token of [
      undefined,
      "invalid",
      `${intent}extra`,
      intent.replace(/^./, "!"),
      "a.字".repeat(300),
    ])
      expect(validConsentIntent(token, "google", null, secret, now)).toBe(false);
    expect(validConsentIntent(intent, "google", null, "wrong-secret", now)).toBe(false);
    expect(validConsentIntent(intent, "google", null, secret, new Date(now.getTime() - 1))).toBe(
      false,
    );
    expect(
      validConsentIntent(intent, "google", null, secret, new Date(now.getTime() + 86400000)),
    ).toBe(false);
  });

  it("records the current version with a caller-supplied server time", async () => {
    const where = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn().mockReturnValue({ where });
    const update = vi.fn().mockReturnValue({ set });
    await acceptTerms({ update } as unknown as Database, "user-id", now);
    expect(set).toHaveBeenCalledWith({ termsVersion: TERMS_VERSION, termsAcceptedAt: now });
    expect(where).toHaveBeenCalledOnce();
  });
});
