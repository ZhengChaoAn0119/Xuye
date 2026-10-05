import { userOrResponse } from "@/server/authz";
import { getDb } from "@/server/db";
import { exportAccountData } from "@/server/services/reader-account";

/** "Download my data": profile, preferences, bookshelf, progress, and bookmarks as JSON. */
export async function GET() {
  const user = await userOrResponse({ allowUnaccepted: true });
  if (user instanceof Response) return user;
  const now = new Date();
  const data = await exportAccountData(getDb(), user.id, now);
  const date = now.toISOString().slice(0, 10);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="xuye-account-${date}.json"`,
      "cache-control": "no-store",
    },
  });
}
