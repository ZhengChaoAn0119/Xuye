import "server-only";
import { getCurrentUser } from "./authz";
import { getDb } from "./db";
import { DEFAULT_READER_PREFERENCES, getReaderPreferences } from "./services/reader-account";

/** The request's reader and their preferences (defaults for visitors). */
export async function getRequestReader() {
  const user = await getCurrentUser();
  if (!user) return { user, preferences: DEFAULT_READER_PREFERENCES };
  const { preferences } = await getReaderPreferences(getDb(), user.id);
  return { user, preferences };
}
