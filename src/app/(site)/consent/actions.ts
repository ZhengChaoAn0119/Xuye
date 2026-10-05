"use server";

import { redirect } from "next/navigation";
import { safeCallbackUrl } from "@/lib/auth";
import { consentUrl } from "@/lib/terms";
import { getCurrentUser } from "@/server/authz";
import { getDb } from "@/server/db";
import { acceptTerms } from "@/server/services/terms-consent";
import type { Route } from "next";
import { cookies } from "next/headers";
import { TERMS_COOKIE } from "@/lib/terms";

export async function confirmTerms(callbackUrl: string, formData: FormData) {
  const destination = safeCallbackUrl(callbackUrl);
  const user = await getCurrentUser();
  if (!user) redirect(`/signin?callbackUrl=${encodeURIComponent(destination)}`);
  (await cookies()).delete(TERMS_COOKIE);
  if (formData.get("terms") !== "agree") redirect(`${consentUrl(destination)}&declined=1`);
  await acceptTerms(getDb(), user.id, new Date());
  redirect(destination as Route);
}
