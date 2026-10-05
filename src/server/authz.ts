import "server-only";
import { notFound, redirect } from "next/navigation";
import { auth } from "./auth";
import type { Actor } from "./services/audit";
import { consentUrl, hasAcceptedTerms } from "@/lib/terms";

export type CurrentUser = {
  id: string;
  email: string | null;
  name: string | null;
  role: "reader" | "admin";
  termsAccepted: boolean;
};

/** The signed-in user, or null. Reads the session cookie (request-time). */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? null,
    name: session.user.name ?? null,
    role: session.user.role,
    termsAccepted: hasAcceptedTerms(session.user),
  };
}

export const actorFor = (user: CurrentUser): Actor => ({
  id: user.id,
  label: user.email ?? user.id,
});

/**
 * Guard for admin pages and Server Actions. Signed-out visitors go to sign-in;
 * signed-in non-admins get a 404 so the admin area is not advertised.
 * Call it in every page and action — layouts alone do not protect actions.
 */
export async function requireAdmin(returnTo = "/admin"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent(returnTo)}`);
  if (user.role !== "admin") notFound();
  if (!user.termsAccepted) redirect(consentUrl(returnTo));
  return user;
}

/** Guard for reader account pages and actions. */
export async function requireUser(returnTo = "/account"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/signin?callbackUrl=${encodeURIComponent(returnTo)}`);
  if (!user.termsAccepted) redirect(consentUrl(returnTo));
  return user;
}

/** Route Handler variant for signed-in reader APIs. */
export async function userOrResponse({ allowUnaccepted = false } = {}): Promise<
  CurrentUser | Response
> {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!allowUnaccepted && !user.termsAccepted)
    return Response.json(
      { error: "terms_required", consentUrl: consentUrl("/account") },
      { status: 403 },
    );
  return user;
}

/** Route Handler variant: returns an error Response instead of redirecting. */
export async function adminOrResponse(): Promise<CurrentUser | Response> {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "請先登入" }, { status: 401 });
  if (user.role !== "admin") return Response.json({ error: "沒有權限" }, { status: 403 });
  if (!user.termsAccepted) return Response.json({ error: "terms_required" }, { status: 403 });
  return user;
}
