import { and, asc, count, desc, eq, ilike, inArray, max, or, sql, sum } from "drizzle-orm";
import type { Database } from "@/server/db/client";
import { authors, chapterContents, chapters, tags, workTags, works } from "@/server/db/schema";
import { visibleChapterWhere } from "@/server/content/visibility";

/** Public, reader-facing reads. Everything here applies the visibility rule. */

export type WorkSummary = {
  id: number;
  title: string;
  authorName: string | null;
  status: "ongoing" | "completed";
  synopsis: string;
  hasSexual: boolean;
  hasViolence: boolean;
  tags: string[];
  /** Visible story chapters (author notes excluded). */
  chapterCount: number;
  wordCount: number;
  lastPublishedAt: Date | null;
  latestChapter: { position: number; title: string } | null;
};

export type DirectoryEntry = {
  id: number;
  position: number;
  title: string;
  kind: "chapter" | "note";
  publishAt: Date | null;
  wordCount: number;
};

/** Escape LIKE wildcards in user input. */
export const escapeLike = (input: string) => input.replace(/[\\%_]/g, (c) => `\\${c}`);

async function summarize(db: Database, now: Date, workIds?: number[]): Promise<WorkSummary[]> {
  if (workIds && workIds.length === 0) return [];
  const visible = visibleChapterWhere(now);
  const scope = workIds ? inArray(chapters.workId, workIds) : undefined;

  const [workRows, stats, latest, tagRows] = await Promise.all([
    db
      .select({
        id: works.id,
        title: works.title,
        authorName: authors.name,
        status: works.status,
        synopsis: works.synopsis,
        hasSexual: works.hasSexual,
        hasViolence: works.hasViolence,
      })
      .from(works)
      .leftJoin(authors, eq(authors.id, works.authorId))
      .where(workIds ? inArray(works.id, workIds) : undefined),
    db
      .select({
        workId: chapters.workId,
        chapterCount: count(sql`case when ${chapters.kind} = 'chapter' then 1 end`),
        wordCount: sum(chapters.wordCount).mapWith(Number),
        lastPublishedAt: max(chapters.publishAt),
      })
      .from(chapters)
      .where(and(visible, scope))
      .groupBy(chapters.workId),
    db
      .selectDistinctOn([chapters.workId], {
        workId: chapters.workId,
        position: chapters.position,
        title: chapters.title,
      })
      .from(chapters)
      .where(and(visible, scope, eq(chapters.kind, "chapter")))
      .orderBy(chapters.workId, desc(chapters.position)),
    db
      .select({ workId: workTags.workId, name: tags.name })
      .from(workTags)
      .innerJoin(tags, eq(tags.id, workTags.tagId))
      .where(workIds ? inArray(workTags.workId, workIds) : undefined)
      .orderBy(asc(tags.name)),
  ]);

  const statsByWork = new Map(stats.map((s) => [s.workId, s]));
  const latestByWork = new Map(latest.map((l) => [l.workId, l]));
  const tagsByWork = new Map<number, string[]>();
  for (const t of tagRows) tagsByWork.set(t.workId, [...(tagsByWork.get(t.workId) ?? []), t.name]);

  return workRows
    .filter((w) => statsByWork.has(w.id)) // a work is public once it has a visible chapter
    .map((w) => {
      const s = statsByWork.get(w.id)!;
      const l = latestByWork.get(w.id);
      return {
        ...w,
        tags: tagsByWork.get(w.id) ?? [],
        chapterCount: s.chapterCount,
        wordCount: s.wordCount ?? 0,
        lastPublishedAt: s.lastPublishedAt,
        latestChapter: l ? { position: l.position, title: l.title } : null,
      };
    })
    .sort((a, b) => (b.lastPublishedAt?.getTime() ?? 0) - (a.lastPublishedAt?.getTime() ?? 0));
}

/** Latest updates: each public work once, newest visible chapter first. */
export async function listLatestWorks(db: Database, now: Date): Promise<WorkSummary[]> {
  return summarize(db, now);
}

export async function searchWorks(db: Database, now: Date, query: string): Promise<WorkSummary[]> {
  const q = query.trim().slice(0, 100);
  if (!q) return summarize(db, now);
  const pattern = `%${escapeLike(q)}%`;
  const matches = await db
    .selectDistinct({ id: works.id })
    .from(works)
    .leftJoin(authors, eq(authors.id, works.authorId))
    .leftJoin(workTags, eq(workTags.workId, works.id))
    .leftJoin(tags, eq(tags.id, workTags.tagId))
    .where(
      or(ilike(works.title, pattern), ilike(authors.name, pattern), ilike(tags.name, pattern)),
    );
  return summarize(
    db,
    now,
    matches.map((m) => m.id),
  );
}

export async function getWorkDetail(db: Database, now: Date, workId: number) {
  const [summary] = await summarize(db, now, [workId]);
  if (!summary) return null;
  const directory: DirectoryEntry[] = await db
    .select({
      id: chapters.id,
      position: chapters.position,
      title: chapters.title,
      kind: chapters.kind,
      publishAt: chapters.publishAt,
      wordCount: chapters.wordCount,
    })
    .from(chapters)
    .where(and(eq(chapters.workId, workId), visibleChapterWhere(now)))
    .orderBy(asc(chapters.position));
  return { ...summary, directory };
}

/** Previous/next readable positions around `position` in a sorted directory. */
export function neighbors(positions: number[], position: number) {
  let prev: number | null = null;
  let next: number | null = null;
  for (const p of positions) {
    if (p < position) prev = p;
    else if (p > position) {
      next = p;
      break;
    }
  }
  return { prev, next };
}

/** Chapter text, re-checking visibility at request time. Quota checks (phase 4) hook in here. */
export async function getChapterBody(db: Database, now: Date, workId: number, position: number) {
  const [row] = await db
    .select({ body: chapterContents.body })
    .from(chapters)
    .innerJoin(chapterContents, eq(chapterContents.chapterId, chapters.id))
    .where(
      and(eq(chapters.workId, workId), eq(chapters.position, position), visibleChapterWhere(now)),
    );
  return row?.body ?? null;
}
