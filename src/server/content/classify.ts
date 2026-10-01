export type ChapterKind = "chapter" | "note";

// Numbered story headings: 第12章 / 第一百章 / 第三卷 / 001 / 01. / 前言 / 序章 …
const STORY_HEADING =
  /^(第\s*[0-9０-９零〇一二三四五六七八九十百千萬兩]+\s*[章回節卷]|[0-9０-９]{1,4}\s*[.、．:：\s]|(前言|序章|序|楔子|引子|尾聲|後記|終章)(\s|$|[:：]))/;

// Author announcements commonly inserted between chapters on serial platforms.
const NOTE_HEADING =
  /(感言|請假|假條|收藏|求月票|求推薦|求首訂|追讀|求救|感謝|打賞|盟主|徵集|單章|說幾句|推薦一下|作息|時差|少兩更|爆更|出事了|書友|更新計劃|篇章結束|人物面板|恭喜|^關於)/;

const UNAVAILABLE_BODY = /(出於版權保護|暫不支持網頁閱讀)/;

/**
 * Heuristic chapter classification for imported books. Admins can override the
 * result; re-imports never overwrite a kind or status that already exists.
 */
export function classifyChapter(
  title: string,
  body: string,
): { kind: ChapterKind; unavailable: boolean } {
  const heading = title.normalize("NFKC").trim();
  // Numbered headings are story even if they beg for votes ("第1章 …（求收藏）");
  // everything unrecognised, including 番外 extras, defaults to story.
  const kind: ChapterKind =
    !STORY_HEADING.test(heading) && NOTE_HEADING.test(heading) ? "note" : "chapter";

  // Placeholder bodies ("本章暫不支持網頁閱讀") carry no story text.
  const unavailable = body.length < 200 && UNAVAILABLE_BODY.test(body);
  return { kind, unavailable };
}
