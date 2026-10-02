"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { type ActiveChapter, announceActiveChapter } from "@/components/reader-events";
import { normalizePrefs, READER_PREFS_KEY } from "@/components/reader-prefs";
import { t } from "@/i18n";
import { formatDateTime, formatNumber } from "@/lib/format";
import { ChapterEnd } from "./chapter-end";
import styles from "./reader.module.css";

type LoadedChapter = ActiveChapter & {
  kind: "chapter" | "note";
  wordCount: number;
  paragraphs: string[];
};

type StreamState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "limited"; reason: "quota" | "rate"; retryAt: string }
  | { kind: "failed" };

/** Slack (px) for "scrolled to the very bottom"; the sentinel sits at the end of the page. */
const LOAD_DISTANCE = 48;
/** The top bar covers this much of the viewport; a chapter is "active" once its top passes it. */
const ACTIVE_OFFSET = 96;

function autoNextEnabled() {
  try {
    return normalizePrefs(JSON.parse(localStorage.getItem(READER_PREFS_KEY) ?? "{}")).autoNext;
  } catch {
    return true;
  }
}

/**
 * Appends the next chapter when the reader reaches the end of the current one.
 *
 * Quota rule (docs/ARCHITECTURE.md §4.3): a chapter is only requested after the reader's
 * own input (wheel, touch, key, pointer) scrolls them to the end of the loaded text, never
 * on page load or after a programmatic progress restore, and only one chapter ahead.
 */
export function ChapterStream({
  workId,
  workTitle,
  initial,
}: {
  workId: number;
  workTitle: string;
  initial: ActiveChapter;
}) {
  const [chapters, setChapters] = useState<LoadedChapter[]>([]);
  const [state, setState] = useState<StreamState>({ kind: "idle" });
  const sentinelRef = useRef<HTMLDivElement>(null);
  const armed = useRef(false);
  const busy = useRef(false);
  const activePosition = useRef(initial.position);

  const last = chapters.at(-1) ?? initial;
  const nextPosition = last.next;

  const load = useCallback(async () => {
    if (busy.current || nextPosition === null) return;
    busy.current = true;
    armed.current = false;
    setState({ kind: "loading" });
    try {
      const response = await fetch(`/api/v1/works/${workId}/chapters/${nextPosition}`);
      const data = await response.json().catch(() => null);
      if (response.ok && data?.status === "ok") {
        setChapters((current) => [...current, { ...data.chapter, paragraphs: data.paragraphs }]);
        setState({ kind: "idle" });
      } else if (data?.status === "quota" || data?.status === "rate") {
        setState({ kind: "limited", reason: data.status, retryAt: data.retryAt });
      } else {
        setState({ kind: "failed" });
      }
    } catch {
      setState({ kind: "failed" });
    } finally {
      busy.current = false;
    }
  }, [nextPosition, workId]);

  // Only the reader's own input arms loading; restoring saved progress scrolls programmatically.
  useEffect(() => {
    const arm = () => {
      armed.current = true;
    };
    const events = ["wheel", "touchmove", "keydown", "pointerdown"] as const;
    for (const name of events) window.addEventListener(name, arm, { passive: true });
    return () => {
      for (const name of events) window.removeEventListener(name, arm);
    };
  }, []);

  useEffect(() => {
    let frame = 0;
    const check = () => {
      frame = 0;
      // Which chapter is the reader in? Keep the URL, title, and chrome in step with it.
      const sections = document.querySelectorAll<HTMLElement>("[data-chapter-position]");
      let active = initial;
      for (const section of sections) {
        if (section.getBoundingClientRect().top > ACTIVE_OFFSET) break;
        const position = Number(section.dataset.chapterPosition);
        active =
          chapters.find((c) => c.position === position) ??
          (position === initial.position ? initial : active);
      }
      if (active.position !== activePosition.current) {
        activePosition.current = active.position;
        window.history.replaceState(null, "", `/works/${workId}/chapters/${active.position}`);
        document.title = `${active.title}｜${workTitle}｜${t("site.name")}`;
        announceActiveChapter(active);
      }

      // The page's own chapter must have rendered successfully (its end nav exists).
      const sentinel = sentinelRef.current;
      if (
        !armed.current ||
        !sentinel ||
        state.kind !== "idle" ||
        nextPosition === null ||
        !document.querySelector("[data-chapter-end]") ||
        sentinel.getBoundingClientRect().top > window.innerHeight + LOAD_DISTANCE ||
        !autoNextEnabled()
      )
        return;
      void load();
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [chapters, initial, load, nextPosition, state.kind, workId, workTitle]);

  return (
    <div className={styles.stream}>
      {chapters.map((chapter) => (
        <section
          key={chapter.position}
          className={styles.article}
          data-chapter-position={chapter.position}
          aria-labelledby={`chapter-${chapter.position}`}
        >
          <header className={styles.header}>
            {chapter.kind === "note" && <p className={styles.noteBadge}>{t("reader.noteBadge")}</p>}
            <h2 id={`chapter-${chapter.position}`} className={styles.title}>
              {chapter.title}
            </h2>
            <p className={styles.meta}>
              {t("reader.meta", {
                minutes: Math.max(1, Math.round(chapter.wordCount / 500)),
                words: formatNumber(chapter.wordCount),
              })}
            </p>
          </header>
          <div className={styles.text}>
            {chapter.paragraphs.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
          <ChapterEnd
            workId={workId}
            position={chapter.position}
            title={chapter.title}
            prev={chapter.prev}
            next={chapter.next}
          />
        </section>
      ))}
      <div ref={sentinelRef} className={styles.streamStatus} aria-live="polite">
        {state.kind === "loading" && <p className={styles.meta}>{t("reader.autoLoading")}</p>}
        {state.kind === "failed" && (
          <p className={styles.meta}>
            {t("reader.autoFailed")}{" "}
            <button type="button" className={styles.inlineButton} onClick={() => void load()}>
              {t("reader.retry")}
            </button>
          </p>
        )}
        {state.kind === "limited" && (
          <section className={styles.restricted} role="note">
            <h2>{t(state.reason === "quota" ? "reader.quotaTitle" : "reader.rateTitle")}</h2>
            <p>
              {t(state.reason === "quota" ? "reader.quotaBody" : "reader.rateBody", {
                time: formatDateTime(new Date(state.retryAt)),
              })}
            </p>
            <div className={styles.endActions}>
              <Link className={styles.button} href={`/works/${workId}`}>
                {t("reader.back")}
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
