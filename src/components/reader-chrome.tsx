"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { t } from "@/i18n";
import {
  applyPrefs,
  normalizePrefs,
  READER_PREFS_KEY,
  READER_SIZE,
  type ReaderPrefs,
  type ReaderTheme,
} from "./reader-prefs";
import styles from "./reader-chrome.module.css";
import { type ActiveChapter, READER_CHAPTER_EVENT } from "./reader-events";

type TocItem = { position: number; title: string; isNote: boolean };

type ReaderChromeProps = {
  workId: number;
  workTitle: string;
  chapterTitle: string;
  current: number;
  chapterId: number;
  prev: number | null;
  next: number | null;
  toc: TocItem[];
  signedIn: boolean;
  initialBookmarked: boolean;
};

function loadPrefs(): ReaderPrefs {
  try {
    return normalizePrefs(JSON.parse(localStorage.getItem(READER_PREFS_KEY) ?? "{}"));
  } catch {
    return normalizePrefs(null);
  }
}

/** Top bar, floating controls, and table of contents for the chapter reader. */
export function ReaderChrome(props: ReaderChromeProps) {
  const { workId, workTitle, toc, signedIn } = props;
  const router = useRouter();
  const [prefs, setPrefs] = useState<ReaderPrefs | null>(null);
  const [tocOpen, setTocOpen] = useState(false);
  const [bookmarked, setBookmarked] = useState(props.initialBookmarked);
  // Auto-loaded chapters (chapter-stream) move the reader on without a navigation.
  const [active, setActive] = useState({
    title: props.chapterTitle,
    position: props.current,
    id: props.chapterId,
    prev: props.prev,
    next: props.next,
  });
  const { title: chapterTitle, position: current, id: chapterId, prev, next } = active;
  const currentRef = useRef<HTMLAnchorElement>(null);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- read device prefs after hydration
  useEffect(() => setPrefs(loadPrefs()), []);

  useEffect(() => {
    const onChapter = (event: Event) => {
      const chapter = (event as CustomEvent<ActiveChapter>).detail;
      setActive(chapter);
      setBookmarked(chapter.bookmarked);
    };
    window.addEventListener(READER_CHAPTER_EVENT, onChapter);
    return () => window.removeEventListener(READER_CHAPTER_EVENT, onChapter);
  }, []);

  const update = (change: Partial<ReaderPrefs>) => {
    const nextPrefs = normalizePrefs({ ...(prefs ?? loadPrefs()), ...change });
    setPrefs(nextPrefs);
    applyPrefs(nextPrefs);
    try {
      localStorage.setItem(READER_PREFS_KEY, JSON.stringify(nextPrefs));
    } catch {
      // storage unavailable: prefs last for this page only
    }
    if (signedIn) {
      const remote: Record<string, unknown> = {};
      if (change.theme !== undefined) remote.readerTheme = nextPrefs.theme;
      if (change.size !== undefined) remote.readerFontSize = nextPrefs.size;
      if (change.font !== undefined) remote.readerFont = nextPrefs.font;
      if (change.lineHeight !== undefined) remote.lineHeight = nextPrefs.lineHeight;
      if (change.pageWidth !== undefined) remote.pageWidth = nextPrefs.pageWidth;
      if (change.autoNext !== undefined) remote.autoNextChapter = nextPrefs.autoNext;
      void fetch("/api/v1/me/preferences", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(remote),
      });
    }
  };

  const toggleBookmark = async () => {
    if (!signedIn) {
      router.push(
        `/signin?callbackUrl=${encodeURIComponent(`/works/${workId}/chapters/${current}`)}`,
      );
      return;
    }
    const nextValue = !bookmarked;
    setBookmarked(nextValue);
    const response = await fetch("/api/v1/me/bookmarks", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chapterId, bookmarked: nextValue }),
    });
    if (!response.ok) setBookmarked(!nextValue);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select"))
        return;
      if (event.key === "Escape") setTocOpen(false);
      else if (event.key === "ArrowLeft" && prev !== null)
        router.push(`/works/${workId}/chapters/${prev}`);
      else if (event.key === "ArrowRight" && next !== null)
        router.push(`/works/${workId}/chapters/${next}`);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, workId, prev, next]);

  useEffect(() => {
    if (tocOpen) currentRef.current?.scrollIntoView({ block: "center" });
  }, [tocOpen]);

  const themes: [ReaderTheme, string, string][] = [
    ["sepia", "◐", t("reader.themeSepia")],
    ["white", "○", t("reader.themeWhite")],
    ["dark", "●", t("reader.themeDark")],
  ];

  return (
    <>
      <header className={styles.top}>
        <Link href={`/works/${workId}`} className={styles.iconButton} aria-label={t("reader.back")}>
          ←
        </Link>
        <p className={styles.title}>
          {workTitle}・{chapterTitle}
        </p>
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => setTocOpen(true)}
          aria-label={t("reader.toc")}
          aria-expanded={tocOpen}
        >
          ☰
        </button>
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => void toggleBookmark()}
          aria-label={bookmarked ? t("reader.removeBookmark") : t("reader.addBookmark")}
          aria-pressed={bookmarked}
        >
          {bookmarked ? "♥" : "♡"}
        </button>
      </header>

      <div className={styles.controls} role="toolbar" aria-label={t("reader.controls")}>
        <button
          type="button"
          onClick={() => update({ size: (prefs?.size ?? READER_SIZE.default) - 1 })}
          aria-label={t("reader.fontSmaller")}
          title={t("reader.fontSmaller")}
        >
          A−
        </button>
        {themes.map(([theme, glyph, label]) => (
          <button
            key={theme}
            type="button"
            onClick={() => update({ theme })}
            aria-label={label}
            title={label}
            aria-pressed={prefs ? prefs.theme === theme : undefined}
          >
            {glyph}
          </button>
        ))}
        <button
          type="button"
          onClick={() => update({ size: (prefs?.size ?? READER_SIZE.default) + 1 })}
          aria-label={t("reader.fontLarger")}
          title={t("reader.fontLarger")}
        >
          A＋
        </button>
        <button
          type="button"
          onClick={() => update({ autoNext: !(prefs?.autoNext ?? true) })}
          aria-label={t("reader.autoNext")}
          title={t(prefs?.autoNext === false ? "reader.autoNextOff" : "reader.autoNextOn")}
          aria-pressed={prefs ? prefs.autoNext : undefined}
          data-toggle
        >
          ⇣
        </button>
        <button type="button" onClick={() => setTocOpen(true)} aria-label={t("reader.toc")}>
          ☰
        </button>
      </div>

      {tocOpen && (
        <div className={styles.backdrop} onClick={() => setTocOpen(false)}>
          <nav
            className={styles.drawer}
            aria-label={t("reader.toc")}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.drawerHead}>
              <strong>{workTitle}</strong>
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => setTocOpen(false)}
                aria-label={t("reader.closeToc")}
              >
                ×
              </button>
            </div>
            <ol className={styles.tocList}>
              {toc.map((item) => (
                <li key={item.position}>
                  <Link
                    ref={item.position === current ? currentRef : undefined}
                    href={`/works/${workId}/chapters/${item.position}`}
                    className={item.position === current ? styles.tocCurrent : styles.tocItem}
                    aria-current={item.position === current ? "page" : undefined}
                    onClick={() => setTocOpen(false)}
                    prefetch={false}
                  >
                    {item.isNote && <span className={styles.note}>{t("common.note")}</span>}
                    {item.title}
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      )}
    </>
  );
}
