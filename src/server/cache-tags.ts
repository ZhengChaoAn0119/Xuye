/**
 * Cache tags shared by cached readers (`use cache` + cacheTag) and writers
 * (updateTag in Server Actions, revalidateTag in Route Handlers).
 * CLI imports run outside Next.js and cannot invalidate tags; cached public
 * pages must therefore also carry a short cacheLife.
 */
export const cacheTags = {
  /** Lists that span works: latest updates, search, sitemap. */
  works: "works",
  work: (workId: number) => `work:${workId}`,
} as const;

export const tagsForWork = (workId: number) => [cacheTags.works, cacheTags.work(workId)];
