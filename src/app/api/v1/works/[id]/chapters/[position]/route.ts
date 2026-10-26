import { getWork, readChapterBody } from "@/server/catalog";
import { getDb } from "@/server/db";
import { getRequestReader } from "@/server/reader";
import { getReadIdentity } from "@/server/request-identity";
import { neighbors } from "@/server/services/catalog";
import { contentAllowed, getChapterAccountState } from "@/server/services/reader-account";

const asInt = (value: string) => (/^\d{1,9}$/.test(value) ? Number(value) : null);
const noStore = { "cache-control": "no-store" };

/**
 * Chapter text for the reader's auto-load of the next chapter. It goes through the
 * same quota and rate-limit authorization as opening the chapter page, so the client
 * only calls it when the reader has actually reached the end of the previous chapter.
 */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/v1/works/[id]/chapters/[position]">,
) {
  const { id, position } = await ctx.params;
  const workId = asInt(id);
  const pos = asInt(position);
  if (workId === null || pos === null)
    return Response.json({ status: "not_found" }, { status: 404, headers: noStore });

  const work = await getWork(workId);
  const entry = work?.directory.find((c) => c.position === pos);
  if (!work || !entry)
    return Response.json({ status: "not_found" }, { status: 404, headers: noStore });

  const { user, preferences } = await getRequestReader();
  if (!contentAllowed(work, preferences))
    return Response.json({ status: "restricted" }, { status: 403, headers: noStore });

  const identity = await getReadIdentity(user?.id ?? null);
  const result = await readChapterBody(work.id, entry.position, entry.id, entry.kind, identity);
  if (result.status === "quota" || result.status === "rate") {
    return Response.json(
      { status: result.status, retryAt: result.authorization.retryAt.toISOString() },
      { status: 429, headers: noStore },
    );
  }
  if (result.status !== "ok")
    return Response.json({ status: "unavailable" }, { status: 404, headers: noStore });

  const { prev, next } = neighbors(
    work.directory.map((c) => c.position),
    entry.position,
  );
  const bookmarked = user
    ? (await getChapterAccountState(getDb(), user.id, entry.id, work.id)).bookmarked
    : false;

  return Response.json(
    {
      status: "ok",
      chapter: {
        id: entry.id,
        position: entry.position,
        title: entry.title,
        kind: entry.kind,
        wordCount: entry.wordCount,
        prev,
        next,
        bookmarked,
      },
      paragraphs: result.body.split("\n"),
    },
    { headers: noStore },
  );
}
