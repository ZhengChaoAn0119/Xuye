import { sql } from "drizzle-orm";
import { connection } from "next/server";
import { getDb } from "@/server/db";
import { checkHealth } from "@/server/services/health";

export async function GET() {
  // Always evaluated per request, never prerendered at build time.
  await connection();
  const report = await checkHealth({
    pingDatabase: async () => {
      await getDb().execute(sql`select 1`);
    },
  });
  return Response.json(report, {
    status: report.status === "ok" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
