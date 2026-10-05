"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { t } from "@/i18n";
import styles from "./reader-chrome.module.css";
import { type ActiveChapter, READER_CHAPTER_EVENT } from "./reader-events";
import {
  READER_SIZE,
  type ReaderPrefs,
  type ReaderTheme,
  setLocalPrefs,
  syncPrefs,
} from "./reader-prefs";
import { usePrefs } from "./use-prefs";

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

/** Top bar, sticky settings row, and table of contents for the chapter reader. */
export function ReaderChrome(props: ReaderChromeProps) {
  const { workId, workTitle, toc, signedIn } = props;
  const router = useRouter();
  const prefs = usePrefs();
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
    const nextPrefs = setLocalPrefs(change);
    if (signedIn) {
      const synced: Partial<ReaderPrefs> = {};
      for (const key of Object.keys(change) as (keyof ReaderPrefs)[])
        Object.assign(synced, { [key]: nextPrefs[key] });
      void syncPrefs(synced);
    }
  };
  const continuous = prefs?.readingMode === "continuous";

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
      // The button already shows the new state; finish the save even if the reader navigates away.
      keepalive: true,
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
        {/* The book title leads to the work's chapter directory; the chapter title opens the TOC. */}
        <p className={styles.title}>
          <Link
            href={`/works/${workId}#directory`}
            className={styles.titleLink}
            title={t("reader.toWorkDirectory")}
          >
            {workTitle}
          </Link>
          <span aria-hidden="true">・</span>
          <button
            type="button"
            className={styles.titleLink}
            onClick={() => setTocOpen(true)}
            title={t("reader.toc")}
          >
            {chapterTitle}
          </button>
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
          onClick={() => update({ readingMode: continuous ? "paged" : "continuous" })}
          aria-label={t("reader.continuousMode")}
          title={t(continuous ? "reader.modeIsContinuous" : "reader.modeIsPaged")}
          aria-pressed={prefs ? continuous : undefined}
        >
          ⇣
        </button>
        <button type="button" onClick={() => setTocOpen(true)} aria-label={t("reader.toc")}>
          ☰
        </button>
        <Link
          href="/settings/reading"
          className={styles.controlLink}
          aria-label={t("settings.title")}
          title={t("settings.title")}
        >
          ⚙
        </Link>
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
