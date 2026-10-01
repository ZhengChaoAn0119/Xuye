import { revalidateTag } from "next/cache";
import { actorFor, adminOrResponse } from "@/server/authz";
import { tagsForWork } from "@/server/cache-tags";
import { EpubParseError } from "@/server/content/epub";
import { describePlan, type ImportPlan } from "@/server/content/import-plan";
import { getDb } from "@/server/db";
import { applyImportPlan, previewEpubImport } from "@/server/services/content-import";

const MAX_BYTES = 50 * 1024 * 1024;

export type ImportSummary = {
  title: string;
  workId: number | null;
  description: string;
  inserts: number;
  updates: number;
  unchanged: number;
  missingFromFile: number[];
  stats: ImportPlan["stats"];
  notes: string[];
  hidden: string[];
  firstNew: string | null;
  lastNew: string | null;
};

const summarize = (plan: ImportPlan): ImportSummary => {
  const touched = [...plan.inserts, ...plan.updates];
  return {
    title: plan.title,
    workId: plan.workId,
    description: describePlan(plan),
    inserts: plan.inserts.length,
    updates: plan.updates.length,
    unchanged: plan.unchanged,
    missingFromFile: plan.missingFromFile,
    stats: plan.stats,
    notes: touched.filter((c) => c.kind === "note").map((c) => `#${c.position} ${c.title}`),
    hidden: touched.filter((c) => c.status === "hidden").map((c) => `#${c.position} ${c.title}`),
    firstNew: plan.inserts[0]?.title ?? null,
    lastNew: plan.inserts.at(-1)?.title ?? null,
  };
};

/**
 * POST multipart `file` (EPUB). `?apply=1` writes; otherwise preview only.
 * A Route Handler rather than a Server Action because EPUBs exceed the 1 MB action limit.
 */
export async function POST(request: Request) {
  const user = await adminOrResponse();
  if (user instanceof Response) return user;

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "請選擇 EPUB 檔案" }, { status: 400 });
  if (!file.name.toLowerCase().endsWith(".epub")) {
    return Response.json({ error: "只接受 .epub 檔案" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) return Response.json({ error: "檔案超過 50 MB" }, { status: 413 });

  const db = getDb();
  try {
    const plan = await previewEpubImport(db, new Uint8Array(await file.arrayBuffer()));
    const summary = summarize(plan);
    if (new URL(request.url).searchParams.get("apply") !== "1") {
      return Response.json({ summary });
    }
    const { workId } = await applyImportPlan(db, plan, {
      publishAt: new Date(),
      actor: actorFor(user),
    });
    tagsForWork(workId).forEach((tag) => revalidateTag(tag, "max"));
    return Response.json({ summary, workId });
  } catch (error) {
    if (error instanceof EpubParseError)
      return Response.json({ error: error.message }, { status: 422 });
    throw error;
  }
}
