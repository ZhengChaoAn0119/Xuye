import { and, asc, count, desc, eq, gt, inArray, max, sql, sum } from "drizzle-orm";
import type { Database } from "@/server/db/client";
import { authors, chapterContents, chapters, tags, workTags, works } from "@/server/db/schema";
import {
  resolvePublishState,
  type ChapterInput,
  type WorkUpdateInput,
} from "@/server/content/schemas";
import { countWords, hashBody } from "@/server/content/text";
import { visibleChapterWhere } from "@/server/content/visibility";
import { recordAudit, type Actor } from "./audit";

export class NotFoundError extends Error {
  override name = "NotFoundError";
}

export async function getDashboardStats(db: Database, now: Date) {
  const [totals] = await db
    .select({
      chapters: count(),
      words: sum(chapters.wordCount).mapWith(Number),
      notes: count(sql`case when ${chapters.kind} = 'note' then 1 end`),
      hidden: count(sql`case when ${chapters.status} = 'hidden' then 1 end`),
      drafts: count(sql`case when ${chapters.status} = 'draft' then 1 end`),
      // Raw sql params bypass column mapping, so pass the Date as an ISO string.
      scheduled: count(
        sql`case when ${chapters.status} = 'published' and ${chapters.publishAt} > ${now.toISOString()}::timestamptz then 1 end`,
      ),
    })
    .from(chapters);
  const [workCount] = await db.select({ works: count() }).from(works);
  return { works: workCount?.works ?? 0, ...totals! };
}

export async function listWorksForAdmin(db: Database, now: Date) {
  const visible = db
    .select({
      workId: chapters.workId,
      visibleChapters: count().as("visible_chapters"),
      lastPublishedAt: max(chapters.publishAt).as("last_published_at"),
    })
    .from(chapters)
    .where(visibleChapterWhere(now))
    .groupBy(chapters.workId)
    .as("visible");
  const totals = db
    .select({ workId: chapters.workId, totalChapters: count().as("total_chapters") })
    .from(chapters)
    .groupBy(chapters.workId)
    .as("totals");

  return db
    .select({
      id: works.id,
      title: works.title,
      authorName: authors.name,
      status: works.status,
      totalChapters: sql<number>`coalesce(${totals.totalChapters}, 0)`.mapWith(Number),
      visibleChapters: sql<number>`coalesce(${visible.visibleChapters}, 0)`.mapWith(Number),
      lastPublishedAt: visible.lastPublishedAt,
      updatedAt: works.updatedAt,
    })
    .from(works)
    .leftJoin(authors, eq(authors.id, works.authorId))
    .leftJoin(visible, eq(visible.workId, works.id))
    .leftJoin(totals, eq(totals.workId, works.id))
    .orderBy(sql`${visible.lastPublishedAt} desc nulls last`, desc(works.id));
}

export async function getWorkForAdmin(db: Database, workId: number) {
  const [work] = await db
    .select({
      id: works.id,
      title: works.title,
      authorName: authors.name,
      synopsis: works.synopsis,
      status: works.status,
      hasSexual: works.hasSexual,
      hasViolence: works.hasViolence,
      updatedAt: works.updatedAt,
    })
    .from(works)
    .leftJoin(authors, eq(authors.id, works.authorId))
    .where(eq(works.id, workId));
  if (!work) return null;

  const [tagRows, chapterRows] = await Promise.all([
    db
      .select({ name: tags.name })
      .from(workTags)
      .innerJoin(tags, eq(tags.id, workTags.tagId))
      .where(eq(workTags.workId, workId))
      .orderBy(asc(tags.name)),
    db
      .select({
        id: chapters.id,
        position: chapters.position,
        title: chapters.title,
        kind: chapters.kind,
        status: chapters.status,
        publishAt: chapters.publishAt,
        wordCount: chapters.wordCount,
      })
      .from(chapters)
      .where(eq(chapters.workId, workId))
      .orderBy(asc(chapters.position)),
  ]);
  return { ...work, tags: tagRows.map((t) => t.name), chapters: chapterRows };
}

export async function updateWork(
  db: Database,
  workId: number,
  input: WorkUpdateInput,
  actor: Actor,
) {
  await db.transaction(async (tx) => {
    let authorId: number | null = null;
    if (input.authorName) {
      await tx.insert(authors).values({ name: input.authorName }).onConflictDoNothing();
      const [author] = await tx
        .select({ id: authors.id })
        .from(authors)
        .where(eq(authors.name, input.authorName));
      authorId = author!.id;
    }
    const updated = await tx
      .update(works)
      .set({
        title: input.title,
        authorId,
        synopsis: input.synopsis,
        status: input.status,
        hasSexual: input.hasSexual,
        hasViolence: input.hasViolence,
      })
      .where(eq(works.id, workId))
      .returning({ id: works.id });
    if (updated.length === 0) throw new NotFoundError(`work ${workId}`);

    await tx.delete(workTags).where(eq(workTags.workId, workId));
    if (input.tags.length > 0) {
      await tx
        .insert(tags)
        .values(input.tags.map((name) => ({ name })))
        .onConflictDoNothing();
      const tagRows = await tx
        .select({ id: tags.id })
        .from(tags)
        .where(inArray(tags.name, input.tags));
      await tx.insert(workTags).values(tagRows.map((t) => ({ workId, tagId: t.id })));
    }
    await recordAudit(tx, actor, {
      action: "work.update",
      entityType: "work",
      entityId: workId,
      detail: { ...input },
    });
  });
}

export async function getChapterForAdmin(db: Database, chapterId: number) {
  const [row] = await db
    .select({
      id: chapters.id,
      workId: chapters.workId,
      workTitle: works.title,
      position: chapters.position,
      title: chapters.title,
      kind: chapters.kind,
      status: chapters.status,
      publishAt: chapters.publishAt,
      wordCount: chapters.wordCount,
      body: chapterContents.body,
    })
    .from(chapters)
    .innerJoin(works, eq(works.id, chapters.workId))
    .innerJoin(chapterContents, eq(chapterContents.chapterId, chapters.id))
    .where(eq(chapters.id, chapterId));
  return row ?? null;
}

/** Append a chapter at the end of the work. */
export async function createChapter(
  db: Database,
  workId: number,
  input: ChapterInput,
  actor: Actor,
  now: Date,
): Promise<{ id: number; position: number }> {
  return db.transaction(async (tx) => {
    // Lock the work row so concurrent appends get distinct positions.
    const [work] = await tx
      .select({ id: works.id })
      .from(works)
      .where(eq(works.id, workId))
      .for("update");
    if (!work) throw new NotFoundError(`work ${workId}`);
    const [last] = await tx
      .select({ position: max(chapters.position) })
      .from(chapters)
      .where(eq(chapters.workId, workId));
    const position = (last?.position ?? 0) + 1;
    const body = input.body.trim();
    const [created] = await tx
      .insert(chapters)
      .values({
        workId,
        position,
        title: input.title,
        kind: input.kind,
        ...resolvePublishState(input, now),
        wordCount: countWords(body),
        contentHash: hashBody(body),
      })
      .returning({ id: chapters.id });
    await tx.insert(chapterContents).values({ chapterId: created!.id, body });
    await tx.update(works).set({ updatedAt: now }).where(eq(works.id, workId));
    await recordAudit(tx, actor, {
      action: "chapter.create",
      entityType: "chapter",
      entityId: created!.id,
      detail: { workId, position, title: input.title, publishMode: input.publishMode },
    });
    return { id: created!.id, position };
  });
}

export async function updateChapter(
  db: Database,
  chapterId: number,
  input: ChapterInput,
  actor: Actor,
  now: Date,
): Promise<{ workId: number }> {
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select({ workId: chapters.workId, status: chapters.status, publishAt: chapters.publishAt })
      .from(chapters)
      .where(eq(chapters.id, chapterId))
      .for("update");
    if (!current) throw new NotFoundError(`chapter ${chapterId}`);
    const body = input.body.trim();
    const state = resolvePublishState(input, now, current);
    await tx
      .update(chapters)
      .set({
        title: input.title,
        kind: input.kind,
        ...state,
        wordCount: countWords(body),
        contentHash: hashBody(body),
      })
      .where(eq(chapters.id, chapterId));
    await tx.update(chapterContents).set({ body }).where(eq(chapterContents.chapterId, chapterId));
    await recordAudit(tx, actor, {
      action: "chapter.update",
      entityType: "chapter",
      entityId: chapterId,
      detail: { title: input.title, kind: input.kind, ...state },
    });
    return { workId: current.workId };
  });
}

/** Chapters published with a future time, soonest first. */
export async function listScheduledChapters(db: Database, now: Date, limit = 20) {
  return db
    .select({
      id: chapters.id,
      workId: chapters.workId,
      workTitle: works.title,
      title: chapters.title,
      publishAt: chapters.publishAt,
    })
    .from(chapters)
    .innerJoin(works, eq(works.id, chapters.workId))
    .where(and(eq(chapters.status, "published"), gt(chapters.publishAt, now)))
    .orderBy(asc(chapters.publishAt))
    .limit(limit);
}
