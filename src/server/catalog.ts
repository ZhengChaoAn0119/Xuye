import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { cacheTags } from "./cache-tags";
import { getDb } from "./db";
import {
  getChapterBody,
  getWorkDetail,
  listLatestWorks,
  searchWorks,
  type WorkSummary,
} from "./services/catalog";

/**
 * Cached public reads. The "catalog" cacheLife (next.config.ts) is short so
 * scheduled chapters and CLI imports — which cannot invalidate tags — still
 * appear within about a minute. "now" is captured when an entry is filled.
 *
 * Works flagged for sexual content stay out of listings until the 18+
 * content preference ships (phase 3).
 */
const listable = (works: WorkSummary[]) => works.filter((w) => !w.hasSexual);

export async function getLatestWorks() {
  "use cache";
  cacheLife("catalog");
  cacheTag(cacheTags.works);
  return listable(await listLatestWorks(getDb(), new Date()));
}

export async function searchCatalog(query: string) {
  "use cache";
  cacheLife("catalog");
  cacheTag(cacheTags.works);
  return listable(await searchWorks(getDb(), new Date(), query));
}

export async function getWork(workId: number) {
  "use cache";
  cacheLife("catalog");
  cacheTag(cacheTags.work(workId));
  return getWorkDetail(getDb(), new Date(), workId);
}

/** Never cached: chapter text is served per request (quota checks land here in phase 4). */
export async function readChapterBody(workId: number, position: number) {
  return getChapterBody(getDb(), new Date(), workId, position);
}
