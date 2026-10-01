import { strToU8, zipSync } from "fflate";

/**
 * Builds a small EPUB 3 in memory, shaped like the Ebook-lib files the
 * platform imports (nav page first, one <h2> + <p>/<br/> per chapter).
 * Used by unit and e2e tests so no real book content lives in the repo.
 */
export function buildTestEpub(book: {
  title: string;
  modified?: string;
  chapters: { title: string; lines: string[] }[];
}): Uint8Array {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const files: Record<string, Uint8Array> = {
    mimetype: strToU8("application/epub+zip"),
    "META-INF/container.xml": strToU8(
      `<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="EPUB/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`,
    ),
  };
  const items: string[] = [
    `<item href="nav.xhtml" id="nav" media-type="application/xhtml+xml" properties="nav"/>`,
  ];
  const spine: string[] = [`<itemref idref="nav"/>`];
  book.chapters.forEach((chapter, i) => {
    const href = `chap_${String(i + 1).padStart(5, "0")}.xhtml`;
    items.push(`<item href="${href}" id="chapter_${i}" media-type="application/xhtml+xml"/>`);
    spine.push(`<itemref idref="chapter_${i}"/>`);
    files[`EPUB/${href}`] = strToU8(
      `<?xml version='1.0' encoding='utf-8'?><!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml"><head><title>${esc(chapter.title)}</title></head><body><h2>${esc(chapter.title)}</h2><p>${chapter.lines.map(esc).join("<br/>")}</p></body></html>`,
    );
  });
  files["EPUB/nav.xhtml"] = strToU8(
    `<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><body><nav epub:type="toc"><h2>${esc(book.title)}</h2><ol>${book.chapters.map((c, i) => `<li><a href="chap_${String(i + 1).padStart(5, "0")}.xhtml">${esc(c.title)}</a></li>`).join("")}</ol></nav></body></html>`,
  );
  files["EPUB/content.opf"] = strToU8(
    `<?xml version='1.0' encoding='utf-8'?><package xmlns="http://www.idpf.org/2007/opf" version="3.0"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${esc(book.title)}</dc:title><dc:language>zh-TW</dc:language><meta property="dcterms:modified">${book.modified ?? "2026-09-28T12:49:42Z"}</meta></metadata><manifest>${items.join("")}</manifest><spine toc="ncx">${spine.join("")}</spine></package>`,
  );
  return zipSync(files);
}
