"use server";

import { signIn, signOut } from "@/server/auth";
import { safeCallbackUrl } from "@/lib/auth";
import { cookies } from "next/headers";
import { TERMS_COOKIE } from "@/lib/terms";
import { serverEnv } from "@/env";
import { getCurrentUser } from "@/server/authz";
import { getDb } from "@/server/db";
import { acceptTerms, createConsentIntent } from "@/server/services/terms-consent";

/** Signing in states agreement (see the sign-in page); the intent is bound to that provider/email. */
async function prepareConsent(provider: string, email: string | null) {
  const jar = await cookies();
  jar.set(TERMS_COOKIE, createConsentIntent(provider, email, serverEnv().AUTH_SECRET, new Date()), {
    httpOnly: true,
    secure: serverEnv().NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 86400,
  });
}

export async function emailSignIn(callbackUrl: string, formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  await prepareConsent("nodemailer", email);
  await signIn("nodemailer", { email, redirectTo: safeCallbackUrl(callbackUrl) });
}

export async function googleSignIn(callbackUrl: string) {
  await prepareConsent("google", null);
  await signIn("google", { redirectTo: safeCallbackUrl(callbackUrl) });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

/**
 * "Accept" on the terms notice, or continued use after the notice was shown. The banner closes
 * itself; no router refresh, which would re-render the page mid-reading (and interrupt loading).
 */
export async function acceptTermsAction() {
  const user = await getCurrentUser();
  if (!user || user.termsAccepted) return;
  await acceptTerms(getDb(), user.id, new Date());
}

/** Declining the current terms ends the account session; reading continues as a visitor. */
export async function declineTermsAction() {
  await signOut({ redirectTo: "/" });
}
