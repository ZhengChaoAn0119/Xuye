"use client";

import { useEffect, useRef } from "react";
import { type ActiveChapter, READER_CHAPTER_EVENT } from "./reader-events";

/** Scroll extent of one chapter; auto-loaded chapters make the page longer than a chapter. */
function chapterSpan(position: number) {
  const element = document.querySelector<HTMLElement>(`[data-chapter-position="${position}"]`);
  if (!element) {
    return { top: 0, span: document.documentElement.scrollHeight - window.innerHeight };
  }
  const top = element.getBoundingClientRect().top + window.scrollY;
  return { top, span: element.offsetHeight - window.innerHeight };
}

function scrollValue(position: number) {
  const { top, span } = chapterSpan(position);
  if (span <= 0) return window.scrollY >= top ? 10_000 : 0;
  return Math.min(10_000, Math.max(0, Math.round(((window.scrollY - top) / span) * 10_000)));
}

export function ReaderProgress({
  workId,
  chapterPosition,
  initialScrollProgress,
}: {
  workId: number;
  chapterPosition: number;
  initialScrollProgress: number;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(initialScrollProgress);
  const position = useRef(chapterPosition);

  useEffect(() => {
    position.current = chapterPosition;
    let restored = false;
    const restore = () => {
      if (restored || initialScrollProgress <= 0) return;
      const { top, span } = chapterSpan(chapterPosition);
      if (span > 0) {
        window.scrollTo({ top: top + (initialScrollProgress / 10_000) * span });
        restored = true;
      }
    };
    const observer = new ResizeObserver(restore);
    observer.observe(document.documentElement);
    restore();
    const save = (keepalive = false) =>
      fetch("/api/v1/me/progress", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          workId,
          chapterPosition: position.current,
          scrollProgress: latest.current,
        }),
        keepalive,
      });
    void save();
    const onScroll = () => {
      latest.current = scrollValue(position.current);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void save(), 800);
    };
    // An auto-loaded chapter scrolled into view: it becomes the saved reading position.
    const onChapter = (event: Event) => {
      position.current = (event as CustomEvent<ActiveChapter>).detail.position;
      restored = true;
      latest.current = scrollValue(position.current);
      void save();
    };
    const onPageHide = () => void save(true);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener(READER_CHAPTER_EVENT, onChapter);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener(READER_CHAPTER_EVENT, onChapter);
      window.removeEventListener("pagehide", onPageHide);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [chapterPosition, initialScrollProgress, workId]);

  return null;
}
