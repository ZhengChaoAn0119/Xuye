import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { cacheTags } from "./cache-tags";
import { getDb } from "./db";
import { getChapterBody, getWorkDetail, listLatestWorks, searchWorks } from "./services/catalog";
import type { ReadIdentity } from "./services/quota";
import { authorizeChapterRead } from "./services/quota";

/**
 * Cached public reads. The "catalog" cacheLife (next.config.ts) is short so
 * scheduled chapters and CLI imports — which cannot invalidate tags — still
 * appear within about a minute. "now" is captured when an entry is filled.
 *
 * Content-preference filtering happens per request outside this shared cache.
 */
export async function getLatestWorks() {
  "use cache";
  cacheLife("catalog");
  cacheTag(cacheTags.works);
  return listLatestWorks(getDb(), new Date());
}

export async function searchCatalog(query: string) {
  "use cache";
  cacheLife("catalog");
  cacheTag(cacheTags.works);
  return searchWorks(getDb(), new Date(), query);
}

export async function getWork(workId: number) {
  "use cache";
  cacheLife("catalog");
  cacheTag(cacheTags.work(workId));
  return getWorkDetail(getDb(), new Date(), workId);
}

/** Never cached: chapter text is served per request (quota checks land here in phase 4). */
export async function readChapterBody(
  workId: number,
  position: number,
  chapterId: number,
  kind: "chapter" | "note",
  identity: ReadIdentity,
) {
  const now = new Date();
  const authorization = await authorizeChapterRead(
    getDb(),
    identity,
    chapterId,
    now,
    kind === "chapter",
  );
  if (!authorization.allowed) return { status: authorization.reason, authorization } as const;
  const body = await getChapterBody(getDb(), now, workId, position);
  if (body === null) return { status: "unavailable" } as const;
  return { status: "ok", body, authorization } as const;
}
