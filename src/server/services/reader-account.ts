import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import type { Database } from "@/server/db/client";
import {
  authors,
  bookmarks,
  bookshelfItems,
  chapters,
  readingProgress,
  userPreferences,
  users,
  works,
} from "@/server/db/schema";
import { visibleChapterWhere } from "@/server/content/visibility";
import { listLatestWorks, type WorkSummary } from "./catalog";

export const DEFAULT_READER_PREFERENCES = {
  readerFontSize: 19,
  readerTheme: "sepia" as const,
  readerFont: "serif" as const,
  sitePalette: "a3" as const,
  lineHeight: 205,
  pageWidth: 720,
  readingMode: null,
  siteTheme: "system" as const,
  worksView: "grid" as const,
  directoryOrder: "oldest" as const,
  showSexual: false,
  showViolence: false,
  showBadge: true,
};

export type ReaderPreferences = {
  readerFontSize: number;
  readerTheme: "sepia" | "white" | "dark";
  readerFont: "serif" | "sans";
  sitePalette: "a1" | "a2" | "a3";
  lineHeight: number;
  pageWidth: number;
  /** null until the reader chooses on first entering the reader. */
  readingMode: ReadingMode | null;
  siteTheme: "light" | "dark" | "system";
  worksView: "grid" | "list";
  directoryOrder: "oldest" | "newest";
  showSexual: boolean;
  showViolence: boolean;
  showBadge: boolean;
};

export type ReadingMode = "paged" | "continuous";

const oneOf = <T extends string, F extends T | null>(
  value: unknown,
  options: readonly T[],
  fallback: F,
): T | F => (options.includes(value as T) ? (value as T) : fallback);

const integerIn = (value: unknown, min: number, max: number, fallback: number) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(max, Math.max(min, Math.round(value)))
    : fallback;

export function normalizeReaderPreferences(value: Partial<ReaderPreferences>): ReaderPreferences {
  return {
    readerFontSize: integerIn(value.readerFontSize, 15, 26, 19),
    readerTheme: ["sepia", "white", "dark"].includes(value.readerTheme ?? "")
      ? value.readerTheme!
      : "sepia",
    readerFont: ["serif", "sans"].includes(value.readerFont ?? "") ? value.readerFont! : "serif",
    sitePalette: ["a1", "a2", "a3"].includes(value.sitePalette ?? "") ? value.sitePalette! : "a3",
    lineHeight: integerIn(value.lineHeight, 150, 260, 205),
    pageWidth: integerIn(value.pageWidth, 560, 920, 720),
    readingMode: oneOf(value.readingMode, ["paged", "continuous"] as const, null),
    siteTheme: oneOf(value.siteTheme, ["light", "dark", "system"] as const, "system"),
    worksView: oneOf(value.worksView, ["grid", "list"] as const, "grid"),
    directoryOrder: oneOf(value.directoryOrder, ["oldest", "newest"] as const, "oldest"),
    showSexual: value.showSexual === true,
    showViolence: value.showViolence === true,
    showBadge: value.showBadge !== false,
  };
}

export function contentAllowed(
  work: Pick<WorkSummary, "hasSexual" | "hasViolence">,
  prefs: Pick<ReaderPreferences, "showSexual" | "showViolence">,
) {
  return (!work.hasSexual || prefs.showSexual) && (!work.hasViolence || prefs.showViolence);
}

export function libraryState(furthest: number | null, latest: number | null) {
  if (furthest === null) return "unread" as const;
  if (latest !== null && furthest < latest) return "new" as const;
  return "done" as const;
}

export function ageOnDate(birthDate: string, today: Date) {
  const [year, month, day] = birthDate.split("-").map(Number);
  if (!year || !month || !day) return -1;
  const birth = new Date(Date.UTC(year, month - 1, day));
  if (
    birth.getUTCFullYear() !== year ||
    birth.getUTCMonth() !== month - 1 ||
    birth.getUTCDate() !== day
  )
    return -1;
  let age = today.getUTCFullYear() - year;
  const beforeBirthday =
    today.getUTCMonth() + 1 < month ||
    (today.getUTCMonth() + 1 === month && today.getUTCDate() < day);
  if (beforeBirthday) age--;
  return age;
}

export async function getReaderPreferences(db: Database, userId: string) {
  const [row] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);
  return {
    exists: Boolean(row),
    preferences: normalizeReaderPreferences(row ?? {}),
  };
}

export async function getAccountProfile(db: Database, userId: string) {
  const [row] = await db
    .select({
      name: users.name,
      email: users.email,
      tier: users.tier,
      termsVersion: users.termsVersion,
      termsAcceptedAt: users.termsAcceptedAt,
      birthDate: users.birthDate,
      ageVerifiedAt: users.ageVerifiedAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row ?? null;
}

export async function saveReaderPreferences(
  db: Database,
  userId: string,
  value: Partial<ReaderPreferences>,
) {
  const current = await getReaderPreferences(db, userId);
  const preferences = normalizeReaderPreferences({ ...current.preferences, ...value });
  await db
    .insert(userPreferences)
    .values({ userId, ...preferences })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: { ...preferences, updatedAt: new Date() },
    });
  return preferences;
}

export async function verifyAdult(db: Database, userId: string, birthDate: string, now: Date) {
  if (ageOnDate(birthDate, now) < 18) return false;
  await db.update(users).set({ birthDate, ageVerifiedAt: now }).where(eq(users.id, userId));
  await db
    .insert(userPreferences)
    .values({ userId, showSexual: true })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: { showSexual: true, updatedAt: now },
    });
  return true;
}

export async function getWorkAccountState(db: Database, userId: string, workId: number) {
  const [[saved], [progress]] = await Promise.all([
    db
      .select({ workId: bookshelfItems.workId })
      .from(bookshelfItems)
      .where(and(eq(bookshelfItems.userId, userId), eq(bookshelfItems.workId, workId)))
      .limit(1),
    db
      .select()
      .from(readingProgress)
      .where(and(eq(readingProgress.userId, userId), eq(readingProgress.workId, workId)))
      .limit(1),
  ]);
  return { saved: Boolean(saved), progress: progress ?? null };
}

export async function setBookshelfItem(
  db: Database,
  userId: string,
  workId: number,
  saved: boolean,
) {
  const [work] = await db.select({ id: works.id }).from(works).where(eq(works.id, workId)).limit(1);
  if (!work) return false;
  if (saved) {
    await db.insert(bookshelfItems).values({ userId, workId }).onConflictDoNothing();
  } else {
    await db
      .delete(bookshelfItems)
      .where(and(eq(bookshelfItems.userId, userId), eq(bookshelfItems.workId, workId)));
  }
  return true;
}

export async function listBookshelf(db: Database, userId: string, now: Date) {
  const [items, allWorks, progressRows] = await Promise.all([
    db
      .select({ workId: bookshelfItems.workId, createdAt: bookshelfItems.createdAt })
      .from(bookshelfItems)
      .where(eq(bookshelfItems.userId, userId))
      .orderBy(desc(bookshelfItems.createdAt)),
    listLatestWorks(db, now),
    db
      .select({
        workId: readingProgress.workId,
        current: readingProgress.currentChapterPosition,
        furthest: readingProgress.furthestChapterPosition,
      })
      .from(readingProgress)
      .where(eq(readingProgress.userId, userId)),
  ]);
  const worksById = new Map(allWorks.map((work) => [work.id, work]));
  const progressByWork = new Map(progressRows.map((progress) => [progress.workId, progress]));
  return items.flatMap((item) => {
    const work = worksById.get(item.workId);
    if (!work) return [];
    const progress = progressByWork.get(item.workId);
    return [
      {
        work,
        createdAt: item.createdAt,
        currentChapterPosition: progress?.current ?? null,
        state: libraryState(progress?.furthest ?? null, work.latestChapter?.position ?? null),
      },
    ];
  });
}

export async function recordReadingProgress(
  db: Database,
  userId: string,
  workId: number,
  chapterPosition: number,
  scrollProgress: number,
  now: Date,
) {
  const [chapter] = await db
    .select({ id: chapters.id })
    .from(chapters)
    .where(
      and(
        eq(chapters.workId, workId),
        eq(chapters.position, chapterPosition),
        visibleChapterWhere(now),
      ),
    )
    .limit(1);
  if (!chapter) return false;
  const scroll = integerIn(scrollProgress, 0, 10_000, 0);
  await db
    .insert(readingProgress)
    .values({
      userId,
      workId,
      currentChapterPosition: chapterPosition,
      furthestChapterPosition: chapterPosition,
      scrollProgress: scroll,
      updatedAt: now,
      hiddenFromHistoryAt: null,
    })
    .onConflictDoUpdate({
      target: [readingProgress.userId, readingProgress.workId],
      set: {
        currentChapterPosition: chapterPosition,
        furthestChapterPosition: sql`greatest(${readingProgress.furthestChapterPosition}, ${chapterPosition})`,
        scrollProgress: scroll,
        updatedAt: now,
        hiddenFromHistoryAt: null,
      },
    });
  return true;
}

export async function listReadingHistory(db: Database, userId: string, now: Date) {
  return db
    .select({
      workId: works.id,
      title: works.title,
      authorName: authors.name,
      hasSexual: works.hasSexual,
      hasViolence: works.hasViolence,
      chapterPosition: readingProgress.currentChapterPosition,
      chapterTitle: chapters.title,
      scrollProgress: readingProgress.scrollProgress,
      updatedAt: readingProgress.updatedAt,
    })
    .from(readingProgress)
    .innerJoin(works, eq(works.id, readingProgress.workId))
    .innerJoin(
      chapters,
      and(
        eq(chapters.workId, readingProgress.workId),
        eq(chapters.position, readingProgress.currentChapterPosition),
      ),
    )
    .leftJoin(authors, eq(authors.id, works.authorId))
    .where(
      and(
        eq(readingProgress.userId, userId),
        isNull(readingProgress.hiddenFromHistoryAt),
        visibleChapterWhere(now),
      ),
    )
    .orderBy(desc(readingProgress.updatedAt));
}

export async function hideHistory(db: Database, userId: string, workId?: number) {
  await db
    .update(readingProgress)
    .set({ hiddenFromHistoryAt: new Date() })
    .where(
      workId === undefined
        ? eq(readingProgress.userId, userId)
        : and(eq(readingProgress.userId, userId), eq(readingProgress.workId, workId)),
    );
}

export async function restoreHistory(db: Database, userId: string, workIds: number[]) {
  if (workIds.length === 0) return;
  await db
    .update(readingProgress)
    .set({ hiddenFromHistoryAt: null })
    .where(and(eq(readingProgress.userId, userId), inArray(readingProgress.workId, workIds)));
}

export async function getChapterAccountState(
  db: Database,
  userId: string,
  chapterId: number,
  workId: number,
) {
  const [[bookmark], [progress]] = await Promise.all([
    db
      .select({ chapterId: bookmarks.chapterId })
      .from(bookmarks)
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.chapterId, chapterId)))
      .limit(1),
    db
      .select({
        chapterPosition: readingProgress.currentChapterPosition,
        scrollProgress: readingProgress.scrollProgress,
      })
      .from(readingProgress)
      .where(and(eq(readingProgress.userId, userId), eq(readingProgress.workId, workId)))
      .limit(1),
  ]);
  return { bookmarked: Boolean(bookmark), progress: progress ?? null };
}

/** Everything this service keeps about a reader, for the "download my data" request. */
export async function exportAccountData(db: Database, userId: string, now: Date) {
  const [profile, { preferences }, shelf, progress, marks] = await Promise.all([
    getAccountProfile(db, userId),
    getReaderPreferences(db, userId),
    db
      .select({
        workId: bookshelfItems.workId,
        title: works.title,
        savedAt: bookshelfItems.createdAt,
      })
      .from(bookshelfItems)
      .innerJoin(works, eq(works.id, bookshelfItems.workId))
      .where(eq(bookshelfItems.userId, userId)),
    db
      .select({
        workId: readingProgress.workId,
        title: works.title,
        currentChapter: readingProgress.currentChapterPosition,
        furthestChapter: readingProgress.furthestChapterPosition,
        updatedAt: readingProgress.updatedAt,
        hiddenFromHistoryAt: readingProgress.hiddenFromHistoryAt,
      })
      .from(readingProgress)
      .innerJoin(works, eq(works.id, readingProgress.workId))
      .where(eq(readingProgress.userId, userId)),
    db
      .select({
        workId: chapters.workId,
        chapter: chapters.position,
        title: chapters.title,
        savedAt: bookmarks.createdAt,
      })
      .from(bookmarks)
      .innerJoin(chapters, eq(chapters.id, bookmarks.chapterId))
      .where(eq(bookmarks.userId, userId)),
  ]);
  return {
    exportedAt: now.toISOString(),
    profile,
    preferences,
    bookshelf: shelf,
    readingProgress: progress,
    bookmarks: marks,
  };
}

/**
 * Deletes a reader account. Preferences, bookshelf, progress, bookmarks, and sessions go with
 * it (ON DELETE CASCADE); audit entries keep their label with a null actor. Quota windows are
 * keyed by text and stay until they expire, so deleting and re-registering cannot reset quota.
 * Admins cannot delete themselves here.
 */
export async function deleteAccount(db: Database, userId: string) {
  const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId));
  if (!user) return "not_found" as const;
  if (user.role === "admin") return "admin" as const;
  await db.delete(users).where(eq(users.id, userId));
  return "deleted" as const;
}

export async function setDisplayName(db: Database, userId: string, name: string) {
  await db.update(users).set({ name }).where(eq(users.id, userId));
}

export async function setBookmark(
  db: Database,
  userId: string,
  chapterId: number,
  bookmarked: boolean,
) {
  const [chapter] = await db
    .select({ id: chapters.id })
    .from(chapters)
    .where(eq(chapters.id, chapterId))
    .limit(1);
  if (!chapter) return false;
  if (bookmarked) {
    await db.insert(bookmarks).values({ userId, chapterId }).onConflictDoNothing();
  } else {
    await db
      .delete(bookmarks)
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.chapterId, chapterId)));
  }
  return true;
}
