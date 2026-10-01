import type { WorkSummary } from "@/server/services/catalog";
import { formatDateTime } from "./format";

/** Serializable shape sent to client components for work lists. */
export type WorkCardData = {
  id: number;
  title: string;
  author: string | null;
  status: "ongoing" | "completed";
  tags: string[];
  chapterCount: number;
  latest: { position: number; title: string } | null;
  updated: string;
};

export const toWorkCard = (w: WorkSummary): WorkCardData => ({
  id: w.id,
  title: w.title,
  author: w.authorName,
  status: w.status,
  tags: w.tags,
  chapterCount: w.chapterCount,
  latest: w.latestChapter,
  updated: formatDateTime(w.lastPublishedAt),
});
