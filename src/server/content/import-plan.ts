import { classifyChapter, type ChapterKind } from "./classify";
import type { ParsedBook } from "./epub";
import { countWords, hashBody, joinParagraphs, sourceKeyFor } from "./text";

export type ExistingChapter = { id: number; position: number; title: string; contentHash: string };
export type ExistingWork = { id: number; title: string; chapters: ExistingChapter[] };

export type PlannedChapter = {
  position: number;
  title: string;
  kind: ChapterKind;
  status: "published" | "hidden";
  body: string;
  contentHash: string;
  wordCount: number;
};

export type ImportPlan = {
  sourceKey: string;
  title: string;
  /** Last-modified time recorded in the file, if any. */
  sourceModifiedAt: Date | null;
  /** Null when the work does not exist yet and will be created. */
  workId: number | null;
  inserts: PlannedChapter[];
  /** Existing chapters whose title or text changed; kind/status are left as admins set them. */
  updates: (PlannedChapter & { id: number })[];
  unchanged: number;
  /** Positions that exist in the database but not in the file (never deleted automatically). */
  missingFromFile: number[];
  stats: { chapters: number; notes: number; hidden: number; words: number };
};

export function planImport(book: ParsedBook, existing: ExistingWork | null): ImportPlan {
  const planned: PlannedChapter[] = book.chapters.map((chapter, index) => {
    const body = joinParagraphs(chapter.paragraphs);
    const { kind, unavailable } = classifyChapter(chapter.title, body);
    return {
      position: index + 1,
      title: chapter.title,
      kind,
      status: unavailable ? "hidden" : "published",
      body,
      contentHash: hashBody(body),
      wordCount: countWords(body),
    };
  });

  const byPosition = new Map(existing?.chapters.map((c) => [c.position, c]) ?? []);
  const plan: ImportPlan = {
    sourceKey: sourceKeyFor(book.title),
    title: book.title,
    sourceModifiedAt: book.modifiedAt,
    workId: existing?.id ?? null,
    inserts: [],
    updates: [],
    unchanged: 0,
    missingFromFile: [...byPosition.keys()].filter((p) => p > planned.length).sort((a, b) => a - b),
    stats: { chapters: 0, notes: 0, hidden: 0, words: 0 },
  };

  for (const chapter of planned) {
    if (chapter.kind === "note") plan.stats.notes++;
    else plan.stats.chapters++;
    if (chapter.status === "hidden") plan.stats.hidden++;
    plan.stats.words += chapter.wordCount;

    const current = byPosition.get(chapter.position);
    if (!current) plan.inserts.push(chapter);
    else if (current.contentHash !== chapter.contentHash || current.title !== chapter.title)
      plan.updates.push({ ...chapter, id: current.id });
    else plan.unchanged++;
  }
  return plan;
}

/** One-line summary for CLI output and the admin preview. */
export function describePlan(plan: ImportPlan): string {
  const action = plan.workId === null ? "新增作品" : `更新作品 #${plan.workId}`;
  const parts = [
    `${action}「${plan.title}」`,
    `新增 ${plan.inserts.length} 章`,
    `更新 ${plan.updates.length} 章`,
    `未變更 ${plan.unchanged} 章`,
    `（正文 ${plan.stats.chapters}、公告 ${plan.stats.notes}、隱藏 ${plan.stats.hidden}，共 ${plan.stats.words.toLocaleString("zh-TW")} 字）`,
  ];
  if (plan.missingFromFile.length > 0)
    parts.push(`⚠ 資料庫多出 ${plan.missingFromFile.length} 章不在檔案中`);
  return parts.join("，");
}
