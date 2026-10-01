import { and, eq, lte, type SQL } from "drizzle-orm";
import { chapters } from "@/server/db/schema";

type ChapterState = { status: "draft" | "published" | "hidden"; publishAt: Date | null };

/**
 * The single rule for whether readers can see a chapter. A published chapter
 * with a future publish time is "scheduled" and appears on its own when the
 * time passes — no background job needed.
 */
export function isChapterVisible(chapter: ChapterState, now: Date): boolean {
  return chapter.status === "published" && chapter.publishAt !== null && chapter.publishAt <= now;
}

/** SQL form of `isChapterVisible`; keep the two in sync (covered by tests). */
export function visibleChapterWhere(now: Date): SQL {
  return and(eq(chapters.status, "published"), lte(chapters.publishAt, now))!;
}

export type ChapterDisplayState = "draft" | "scheduled" | "published" | "hidden";

export function chapterDisplayState(chapter: ChapterState, now: Date): ChapterDisplayState {
  if (chapter.status !== "published") return chapter.status;
  return isChapterVisible(chapter, now) ? "published" : "scheduled";
}
