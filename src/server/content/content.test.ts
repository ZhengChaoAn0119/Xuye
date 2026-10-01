import { describe, expect, it } from "vitest";
import { classifyChapter } from "./classify";
import { EpubParseError, parseEpub } from "./epub";
import { buildTestEpub } from "./fixtures";
import { describePlan, planImport } from "./import-plan";
import { countWords, decodeEntities, hashBody, htmlToParagraphs, sourceKeyFor } from "./text";
import { chapterDisplayState, isChapterVisible } from "./visibility";

describe("text", () => {
  it("decodes named and numeric entities", () => {
    expect(decodeEntities("&lt;a&gt; &amp; &#20013;&#x6587; &bogus;")).toBe("<a> & 中文 &bogus;");
  });

  it("splits <br/> lines, trims indentation, and drops scraping noise", () => {
    const html =
      "<h2>第1章 開始</h2><p>第1章 開始<br/>　　第一段<br/><br/>第二段 &amp; 引號<br/>&gt;<br/>(本章完)</p>";
    expect(htmlToParagraphs(html, "第1章 開始")).toEqual(["第一段", "第二段 & 引號"]);
  });

  it("counts characters without whitespace", () => {
    expect(countWords("一二三\n四 五　六")).toBe(6);
  });

  it("normalizes source keys", () => {
    expect(sourceKeyFor(" 東京：從零開始  ")).toBe(sourceKeyFor("東京:從零開始"));
  });
});

describe("classifyChapter", () => {
  const kind = (title: string) => classifyChapter(title, "正文".repeat(200)).kind;

  it.each([
    "第1章 這對勁嗎？",
    "第一百三十二章 神代大小姐",
    "第1章 【奧伊薩斯特】（求收藏）",
    "001 蘿莉女僕與世界末日",
    "01.綱手",
    "前言 死亡與新生",
    "番外：神權的竊取者",
    "月票番外：變成貓咪的魔法",
    "第十二層 打到200層",
    "第261章",
  ])("treats %s as story", (title) => expect(kind(title)).toBe("chapter"));

  it.each([
    "上架感言",
    "上架感言【求首訂】",
    "請假一天，附原因",
    "請假條",
    "歡迎收藏",
    "意見徵集章·其之二",
    "感謝大佬［呆頭鵝阿凡］的盟主打賞",
    "緊急求救！請大家追讀一下前兩章！",
    "八十四字爆更了，不能多更了，求月票",
    "關於番外的二三事",
    "主角人物面板（到122章為止）",
    "新年給書友的一封信",
    "恭喜法爾孔Major冠軍！！！",
    "調整下作息，今天三更。",
  ])("treats %s as an author note", (title) => expect(kind(title)).toBe("note"));

  it("flags placeholder bodies as unavailable", () => {
    expect(classifyChapter("番外", "出於版權保護，本章暫不支持網頁閱讀").unavailable).toBe(true);
    expect(classifyChapter("第1章", "正文".repeat(200)).unavailable).toBe(false);
  });
});

describe("parseEpub", () => {
  const bytes = buildTestEpub({
    title: "測試之書",
    chapters: [
      { title: "第1章 起點", lines: ["第一段", "第二段 <引號>"] },
      { title: "請假條", lines: ["今天請假"] },
    ],
  });

  it("reads metadata and chapters in spine order, skipping the nav page", () => {
    const book = parseEpub(bytes);
    expect(book.title).toBe("測試之書");
    expect(book.language).toBe("zh-TW");
    expect(book.modifiedAt?.toISOString()).toBe("2026-09-28T12:49:42.000Z");
    expect(book.chapters).toEqual([
      { title: "第1章 起點", paragraphs: ["第一段", "第二段 <引號>"] },
      { title: "請假條", paragraphs: ["今天請假"] },
    ]);
  });

  it("rejects files that are not EPUBs", () => {
    expect(() => parseEpub(new TextEncoder().encode("not a zip"))).toThrow(EpubParseError);
  });
});

describe("planImport", () => {
  const book = parseEpub(
    buildTestEpub({
      title: "測試之書",
      chapters: [
        { title: "第1章 起點", lines: ["一"] },
        { title: "上架感言", lines: ["謝謝"] },
        { title: "第2章 續", lines: ["二"] },
      ],
    }),
  );

  it("inserts everything for a new work and classifies notes", () => {
    const plan = planImport(book, null);
    expect(plan.workId).toBeNull();
    expect(plan.inserts.map((c) => [c.position, c.kind])).toEqual([
      [1, "chapter"],
      [2, "note"],
      [3, "chapter"],
    ]);
    expect(plan.stats).toMatchObject({ chapters: 2, notes: 1, hidden: 0 });
    expect(describePlan(plan)).toContain("新增 3 章");
  });

  it("only appends new chapters and updates changed ones on re-import", () => {
    const plan = planImport(book, {
      id: 7,
      title: "測試之書",
      chapters: [
        { id: 1, position: 1, title: "第1章 起點", contentHash: hashBody("一") },
        { id: 2, position: 2, title: "上架感言", contentHash: hashBody("舊內容") },
      ],
    });
    expect(plan.workId).toBe(7);
    expect(plan.unchanged).toBe(1);
    expect(plan.updates.map((u) => u.id)).toEqual([2]);
    expect(plan.inserts.map((c) => c.position)).toEqual([3]);
  });

  it("reports database chapters missing from the file instead of deleting them", () => {
    const plan = planImport(book, {
      id: 7,
      title: "測試之書",
      chapters: [{ id: 9, position: 5, title: "第5章", contentHash: "x" }],
    });
    expect(plan.missingFromFile).toEqual([5]);
  });
});

describe("visibility", () => {
  const now = new Date("2026-10-01T12:00:00Z");
  const past = new Date("2026-10-01T11:00:00Z");
  const future = new Date("2026-10-01T13:00:00Z");

  it("shows only published chapters whose time has come", () => {
    expect(isChapterVisible({ status: "published", publishAt: past }, now)).toBe(true);
    expect(isChapterVisible({ status: "published", publishAt: now }, now)).toBe(true);
    expect(isChapterVisible({ status: "published", publishAt: future }, now)).toBe(false);
    expect(isChapterVisible({ status: "published", publishAt: null }, now)).toBe(false);
    expect(isChapterVisible({ status: "draft", publishAt: past }, now)).toBe(false);
    expect(isChapterVisible({ status: "hidden", publishAt: past }, now)).toBe(false);
  });

  it("labels future published chapters as scheduled", () => {
    expect(chapterDisplayState({ status: "published", publishAt: future }, now)).toBe("scheduled");
    expect(chapterDisplayState({ status: "published", publishAt: past }, now)).toBe("published");
    expect(chapterDisplayState({ status: "draft", publishAt: null }, now)).toBe("draft");
  });
});
