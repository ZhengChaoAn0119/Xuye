import "server-only";
import { cookies, headers } from "next/headers";
import { serverEnv } from "@/env";
import {
  privateHash,
  readVisitorToken,
  VISITOR_COOKIE,
  visitorSecret,
} from "@/lib/visitor-identity";
import type { ReadIdentity } from "./services/quota";

function clientIp(requestHeaders: Headers) {
  return (
    requestHeaders.get("cf-connecting-ip")?.trim() ||
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export async function getReadIdentity(userId: string | null): Promise<ReadIdentity> {
  const env = serverEnv();
  const secret = visitorSecret(env);
  const requestHeaders = await headers();
  const ipHash = privateHash(clientIp(requestHeaders), secret, "ip");
  if (userId) return { subject: "free", subjectKey: userId, ipHash };
  const token = (await cookies()).get(VISITOR_COOKIE)?.value;
  const cookieId = readVisitorToken(token, secret);
  const fallback = privateHash(
    `${ipHash}:${requestHeaders.get("user-agent") ?? "unknown"}`,
    secret,
    "trait",
  );
  return {
    subject: "visitor",
    subjectKey: cookieId ?? `fallback:${fallback}`,
    ipHash,
    visitorCookieId: cookieId ?? undefined,
  };
}

export async function getVisitorRequestIdentity() {
  const identity = await getReadIdentity(null);
  return identity.visitorCookieId ? identity : null;
}
