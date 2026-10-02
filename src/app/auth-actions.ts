"use server";

import { signIn, signOut } from "@/server/auth";
import { safeCallbackUrl } from "@/lib/auth";

export async function emailSignIn(callbackUrl: string, formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  await signIn("nodemailer", { email, redirectTo: safeCallbackUrl(callbackUrl) });
}

export async function googleSignIn(callbackUrl: string) {
  await signIn("google", { redirectTo: safeCallbackUrl(callbackUrl) });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
