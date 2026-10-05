import "server-only";
import { getCurrentUser } from "./authz";
import { getDb } from "./db";
import { DEFAULT_READER_PREFERENCES, getReaderPreferences } from "./services/reader-account";
import { redirect } from "next/navigation";
import { consentUrl } from "@/lib/terms";

export async function getRequestReader() {
  const user = await getCurrentUser();
  if (!user) return { user: null, preferences: DEFAULT_READER_PREFERENCES };
  if (!user.termsAccepted) redirect(consentUrl("/"));
  const { preferences } = await getReaderPreferences(getDb(), user.id);
  return { user, preferences };
}
