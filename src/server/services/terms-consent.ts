import { createHmac, timingSafeEqual } from "node:crypto";
import { and, eq, isNull, ne, or } from "drizzle-orm";
import { TERMS_VERSION } from "@/lib/terms";
import type { Database } from "@/server/db";
import { users } from "@/server/db/schema";

const MAX_AGE = 24 * 60 * 60 * 1000;
const mac = (value: string, secret: string) =>
  createHmac("sha256", secret).update(`terms:${value}`).digest("base64url");

/** A short-lived, signed form choice, bound to the email/provider that will authenticate. */
export function createConsentIntent(
  provider: string,
  email: string | null,
  secret: string,
  now: Date,
) {
  const payload = Buffer.from(
    JSON.stringify({
      version: TERMS_VERSION,
      provider,
      email: email ? mac(email.trim().toLowerCase(), secret) : null,
      issuedAt: now.getTime(),
    }),
  ).toString("base64url");
  return `${payload}.${mac(payload, secret)}`;
}

export function validConsentIntent(
  token: string | undefined,
  provider: string,
  email: string | null,
  secret: string,
  now: Date,
) {
  if (!token || token.length > 1024) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, signature] = parts as [string, string];
  const expected = mac(payload, secret);
  const suppliedBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expected);
  if (
    suppliedBytes.length !== expectedBytes.length ||
    !timingSafeEqual(suppliedBytes, expectedBytes)
  )
    return false;
  try {
    const intent = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const age = now.getTime() - intent.issuedAt;
    return (
      intent.version === TERMS_VERSION &&
      intent.provider === provider &&
      intent.email === (email ? mac(email.trim().toLowerCase(), secret) : null) &&
      Number.isFinite(age) &&
      age >= 0 &&
      age < MAX_AGE
    );
  } catch {
    return false;
  }
}

/** Keep the first acceptance time for a version; never backfill legacy users as accepted. */
export async function acceptTerms(db: Database, userId: string, now: Date) {
  await db
    .update(users)
    .set({ termsVersion: TERMS_VERSION, termsAcceptedAt: now })
    .where(
      and(
        eq(users.id, userId),
        or(
          isNull(users.termsVersion),
          ne(users.termsVersion, TERMS_VERSION),
          isNull(users.termsAcceptedAt),
        ),
      ),
    );
}
