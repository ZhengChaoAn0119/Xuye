"use client";

import { useEffect, useRef } from "react";

function scrollValue() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max <= 0 ? 0 : Math.min(10_000, Math.max(0, Math.round((window.scrollY / max) * 10_000)));
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

  useEffect(() => {
    let restored = false;
    const restore = () => {
      if (restored || initialScrollProgress <= 0) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0) {
        window.scrollTo({ top: (initialScrollProgress / 10_000) * max });
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
        body: JSON.stringify({ workId, chapterPosition, scrollProgress: latest.current }),
        keepalive,
      });
    void save();
    const onScroll = () => {
      latest.current = scrollValue();
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void save(), 800);
    };
    const onPageHide = () => void save(true);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", onPageHide);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", onPageHide);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [chapterPosition, initialScrollProgress, workId]);

  return null;
}
