"use server";

import { signIn, signOut } from "@/server/auth";
import { safeCallbackUrl } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { consentUrl, TERMS_COOKIE } from "@/lib/terms";
import { serverEnv } from "@/env";
import { createConsentIntent } from "@/server/services/terms-consent";

async function prepareConsent(
  provider: string,
  email: string | null,
  callbackUrl: string,
  formData: FormData,
) {
  const jar = await cookies();
  if (formData.get("terms") !== "agree") {
    jar.delete(TERMS_COOKIE);
    redirect(
      `/signin?consent=declined&callbackUrl=${encodeURIComponent(safeCallbackUrl(callbackUrl))}`,
    );
  }
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
  await prepareConsent("nodemailer", email, callbackUrl, formData);
  await signIn("nodemailer", { email, redirectTo: consentUrl(safeCallbackUrl(callbackUrl)) });
}

export async function googleSignIn(callbackUrl: string, formData: FormData) {
  await prepareConsent("google", null, callbackUrl, formData);
  await signIn("google", { redirectTo: consentUrl(safeCallbackUrl(callbackUrl)) });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
