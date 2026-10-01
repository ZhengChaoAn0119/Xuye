import type { DbOrTx } from "@/server/db/client";
import { auditLogs } from "@/server/db/schema";

export type Actor = { id: string | null; label: string };

export async function recordAudit(
  db: DbOrTx,
  actor: Actor,
  entry: {
    action: string;
    entityType: string;
    entityId: string | number;
    detail?: Record<string, unknown>;
  },
) {
  await db.insert(auditLogs).values({
    actorId: actor.id,
    actorLabel: actor.label,
    action: entry.action,
    entityType: entry.entityType,
    entityId: String(entry.entityId),
    detail: entry.detail ?? {},
  });
}
