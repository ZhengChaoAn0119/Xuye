import { asc, eq, sql } from "drizzle-orm";
import type { Database } from "@/server/db/client";
import { chapterContents, chapters, works } from "@/server/db/schema";
import { parseEpub } from "@/server/content/epub";
import { planImport, type ExistingWork, type ImportPlan } from "@/server/content/import-plan";
import { sourceKeyFor } from "@/server/content/text";
import { recordAudit, type Actor } from "./audit";

const CHUNK = 200;

async function loadExistingWork(db: Database, sourceKey: string): Promise<ExistingWork | null> {
  const [work] = await db
    .select({ id: works.id, title: works.title })
    .from(works)
    .where(eq(works.sourceKey, sourceKey));
  if (!work) return null;
  const rows = await db
    .select({
      id: chapters.id,
      position: chapters.position,
      title: chapters.title,
      contentHash: chapters.contentHash,
    })
    .from(chapters)
    .where(eq(chapters.workId, work.id))
    .orderBy(asc(chapters.position));
  return { ...work, chapters: rows };
}

/** Parse an EPUB and compare it with the database. Read-only. */
export async function previewEpubImport(db: Database, bytes: Uint8Array): Promise<ImportPlan> {
  const book = parseEpub(bytes);
  return planImport(book, await loadExistingWork(db, sourceKeyFor(book.title)));
}

/**
 * Apply an import plan in one transaction. New chapters are published at
 * `publishAt`; existing chapters keep their kind, status, and publish time.
 */
export async function applyImportPlan(
  db: Database,
  plan: ImportPlan,
  options: { publishAt: Date; actor: Actor },
): Promise<{ workId: number }> {
  return db.transaction(async (tx) => {
    let workId = plan.workId;
    if (workId === null) {
      const [created] = await tx
        .insert(works)
        .values({ title: plan.title, sourceKey: plan.sourceKey })
        .returning({ id: works.id });
      workId = created!.id;
    }

    for (let i = 0; i < plan.inserts.length; i += CHUNK) {
      const batch = plan.inserts.slice(i, i + CHUNK);
      const inserted = await tx
        .insert(chapters)
        .values(
          batch.map((c) => ({
            workId: workId!,
            position: c.position,
            title: c.title,
            kind: c.kind,
            status: c.status,
            publishAt: options.publishAt,
            wordCount: c.wordCount,
            contentHash: c.contentHash,
          })),
        )
        .returning({ id: chapters.id, position: chapters.position });
      const bodyByPosition = new Map(batch.map((c) => [c.position, c.body]));
      await tx
        .insert(chapterContents)
        .values(
          inserted.map((row) => ({ chapterId: row.id, body: bodyByPosition.get(row.position)! })),
        );
    }

    for (const update of plan.updates) {
      await tx
        .update(chapters)
        .set({ title: update.title, wordCount: update.wordCount, contentHash: update.contentHash })
        .where(eq(chapters.id, update.id));
      await tx
        .update(chapterContents)
        .set({ body: update.body })
        .where(eq(chapterContents.chapterId, update.id));
    }

    if (plan.inserts.length > 0 || plan.updates.length > 0) {
      await tx
        .update(works)
        .set({ updatedAt: sql`now()` })
        .where(eq(works.id, workId));
    }
    await recordAudit(tx, options.actor, {
      action: plan.workId === null ? "work.import.create" : "work.import.update",
      entityType: "work",
      entityId: workId,
      detail: {
        title: plan.title,
        inserted: plan.inserts.length,
        updated: plan.updates.length,
        unchanged: plan.unchanged,
        missingFromFile: plan.missingFromFile,
      },
    });
    return { workId };
  });
}
