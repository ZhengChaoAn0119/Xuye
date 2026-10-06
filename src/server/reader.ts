import "server-only";
import { getCurrentUser } from "./authz";
import { getDb } from "./db";
import { DEFAULT_READER_PREFERENCES, getReaderPreferences } from "./services/reader-account";
import { redirect } from "next/navigation";
import { consentUrl } from "@/lib/terms";

/** Read identity without redirecting, so JSON routes can return their own consent error. */
export async function getRequestReaderState() {
  const user = await getCurrentUser();
  if (!user?.termsAccepted) return { user, preferences: DEFAULT_READER_PREFERENCES };
  const { preferences } = await getReaderPreferences(getDb(), user.id);
  return { user, preferences };
}

export async function getRequestReader(returnTo = "/") {
  const state = await getRequestReaderState();
  if (state.user && !state.user.termsAccepted) redirect(consentUrl(returnTo));
  return state;
}
