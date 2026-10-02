import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { serverEnv } from "@/env";
import {
  createVisitorToken,
  readVisitorToken,
  VISITOR_COOKIE,
  VISITOR_COOKIE_MAX_AGE,
  visitorSecret,
} from "@/lib/visitor-identity";

export function proxy(request: NextRequest) {
  const secret = visitorSecret(serverEnv());
  const current = request.cookies.get(VISITOR_COOKIE)?.value;
  if (readVisitorToken(current, secret)) return NextResponse.next();

  const token = createVisitorToken(secret);
  // Make the new identity available to this same Server Component request as
  // well as persist it in the browser for later reads.
  request.cookies.set(VISITOR_COOKIE, token);
  const response = NextResponse.next({ request: { headers: request.headers } });
  response.cookies.set(VISITOR_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: VISITOR_COOKIE_MAX_AGE,
    priority: "high",
  });
  return response;
}

export const config = {
  matcher: ["/works/:workId/chapters/:position", "/api/v1/visitor/:path*"],
};
