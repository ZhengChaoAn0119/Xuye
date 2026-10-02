import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export const VISITOR_COOKIE = "xuye_visitor";
export const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const signature = (id: string, secret: string) =>
  createHmac("sha256", secret).update(`visitor-cookie:${id}`).digest("base64url");

export function createVisitorToken(secret: string, id = randomUUID()) {
  return `${id}.${signature(id, secret)}`;
}

export function readVisitorToken(token: string | undefined, secret: string): string | null {
  if (!token) return null;
  const split = token.lastIndexOf(".");
  if (split < 1) return null;
  const id = token.slice(0, split);
  const supplied = token.slice(split + 1);
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const expected = signature(id, secret);
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b) ? id : null;
}

export function privateHash(value: string, secret: string, purpose: "ip" | "trait") {
  return createHmac("sha256", secret).update(`${purpose}:${value}`).digest("base64url");
}

export function visitorSecret(env: { AUTH_SECRET: string; VISITOR_ID_SECRET?: string }) {
  return env.VISITOR_ID_SECRET ?? env.AUTH_SECRET;
}
