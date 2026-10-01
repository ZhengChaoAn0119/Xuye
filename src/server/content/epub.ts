import { strFromU8, unzipSync } from "fflate";
import { decodeEntities, htmlToParagraphs, inlineText } from "./text";

export class EpubParseError extends Error {
  override name = "EpubParseError";
}

export type ParsedChapter = { title: string; paragraphs: string[] };
export type ParsedBook = {
  title: string;
  language: string | null;
  modifiedAt: Date | null;
  chapters: ParsedChapter[];
};

type ManifestItem = { href: string; mediaType: string; properties: string };

const attr = (tag: string, name: string) =>
  new RegExp(`\\s${name}\\s*=\\s*(["'])(.*?)\\1`, "i").exec(tag)?.[2] ?? null;

function resolvePath(base: string, href: string): string {
  const parts = (base + decodeURIComponent(href.split("#")[0]!)).split("/");
  const out: string[] = [];
  for (const part of parts) {
    if (part === "..") out.pop();
    else if (part !== "." && part !== "") out.push(part);
  }
  return out.join("/");
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value.trim());
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Parse an EPUB 2/3 file into ordered chapters of plain-text paragraphs.
 * Navigation documents and non-XHTML spine items are skipped.
 */
export function parseEpub(bytes: Uint8Array): ParsedBook {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes);
  } catch {
    throw new EpubParseError("檔案不是有效的 EPUB（無法解壓縮）");
  }
  const read = (path: string) => (files[path] ? strFromU8(files[path]) : null);

  const container = read("META-INF/container.xml");
  const opfPath = container && attr(/<rootfile\b[^>]*>/i.exec(container)?.[0] ?? "", "full-path");
  const opf = opfPath ? read(opfPath) : null;
  if (!opfPath || !opf) throw new EpubParseError("找不到 EPUB 的套件描述檔（OPF）");
  const base = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1) : "";

  const title = inlineText(/<dc:title\b[^>]*>([\s\S]*?)<\/dc:title>/i.exec(opf)?.[1] ?? "");
  if (!title) throw new EpubParseError("EPUB 缺少書名（dc:title）");
  const language =
    inlineText(/<dc:language\b[^>]*>([\s\S]*?)<\/dc:language>/i.exec(opf)?.[1] ?? "") || null;
  const modifiedTag = /<meta\b[^>]*property=["']dcterms:modified["'][^>]*>([^<]*)/i.exec(opf);
  const modifiedAt = parseDate(
    (modifiedTag && (modifiedTag[1]?.trim() || attr(modifiedTag[0], "content"))) ??
      /<dc:date\b[^>]*>([^<]*)<\/dc:date>/i.exec(opf)?.[1] ??
      null,
  );

  const manifest = new Map<string, ManifestItem>();
  for (const [tag] of opf.matchAll(/<item\b[^>]*>/gi)) {
    const id = attr(tag, "id");
    const href = attr(tag, "href");
    if (id && href) {
      manifest.set(id, {
        href: decodeEntities(href),
        mediaType: attr(tag, "media-type") ?? "",
        properties: attr(tag, "properties") ?? "",
      });
    }
  }

  const chapters: ParsedChapter[] = [];
  for (const [tag] of opf.matchAll(/<itemref\b[^>]*>/gi)) {
    const item = manifest.get(attr(tag, "idref") ?? "");
    if (!item || !/xhtml|html/i.test(item.mediaType) || /\bnav\b/.test(item.properties)) continue;
    const doc = read(resolvePath(base, item.href));
    if (!doc || /<nav\b[^>]*epub:type=["']toc["']/i.test(doc)) continue;

    const heading = /<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/i.exec(doc)?.[1];
    const chapterTitle = inlineText(
      heading ?? /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(doc)?.[1] ?? "",
    );
    const body = /<body\b[^>]*>([\s\S]*)<\/body>/i.exec(doc)?.[1] ?? "";
    chapters.push({
      title: chapterTitle || `第 ${chapters.length + 1} 章`,
      paragraphs: htmlToParagraphs(body, chapterTitle),
    });
  }
  if (chapters.length === 0) throw new EpubParseError("EPUB 中沒有可匯入的章節");
  return { title, language, modifiedAt, chapters };
}
