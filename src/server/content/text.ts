import { createHash } from "node:crypto";

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

export function decodeEntities(input: string): string {
  return input.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const n =
        code[1] === "x" || code[1] === "X" ? parseInt(code.slice(2), 16) : Number(code.slice(1));
      return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : match;
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? match;
  });
}

/** Strip tags and decode entities from a short inline fragment such as a heading. */
export function inlineText(fragment: string): string {
  return decodeEntities(fragment.replace(/<[^>]*>/g, ""))
    .replace(/\s+/g, " ")
    .trim();
}

// Leading/trailing whitespace including full-width spaces used for indentation.
const EDGE_SPACE = /^[\s　]+|[\s　]+$/g;
const NOISE_LINE = /^[>＞]+$/;
const END_MARK = /^[(（]本章完[)）]$/;

const normalize = (s: string) => s.normalize("NFKC").replace(/\s+/g, "");

/**
 * Turn chapter body XHTML into clean paragraphs: one entry per <p>/<br> line,
 * entities decoded, indentation trimmed, empty lines and scraping noise removed.
 */
export function htmlToParagraphs(bodyHtml: string, title = ""): string[] {
  const text = bodyHtml
    .replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(p|div|section|article|blockquote|li)\b[^>]*>/gi, "\n")
    .replace(/<[^>]*>/g, "");
  const lines = decodeEntities(text)
    .split("\n")
    .map((line) => line.replace(EDGE_SPACE, ""))
    .filter((line) => line.length > 0 && !NOISE_LINE.test(line));

  if (title && lines.length > 0 && normalize(lines[0]!) === normalize(title)) lines.shift();
  while (lines.length > 0 && END_MARK.test(lines.at(-1)!)) lines.pop();
  return lines;
}

/** Stored chapter body: plain text, one paragraph per line. */
export const joinParagraphs = (paragraphs: string[]) => paragraphs.join("\n");

/** Characters excluding whitespace — the usual Chinese "字數". */
export const countWords = (body: string) => body.replace(/[\s　]/g, "").length;

export const hashBody = (body: string) => createHash("sha256").update(body).digest("hex");

/** Key that identifies the same work across re-imports. */
export const sourceKeyFor = (title: string) => title.normalize("NFKC").replace(/\s+/g, " ").trim();
