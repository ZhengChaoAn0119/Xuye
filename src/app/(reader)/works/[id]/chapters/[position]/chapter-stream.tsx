"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { type ActiveChapter, announceActiveChapter } from "@/components/reader-events";
import { usePrefs } from "@/components/use-prefs";
import { t } from "@/i18n";
import { formatDateTime, formatNumber } from "@/lib/format";
import { ChapterEnd } from "./chapter-end";
import styles from "./reader.module.css";

type StreamChapter = ActiveChapter & {
  kind: "chapter" | "note";
  wordCount: number;
  /** null once the text was released from this page; reading it again needs a new request. */
  paragraphs: string[] | null;
};

type StreamState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "limited"; reason: "quota" | "rate"; retryAt: string }
  | { kind: "failed" };

type ChapterResponse =
  | { status: "ok"; chapter: Omit<StreamChapter, "paragraphs">; paragraphs: string[] }
  | { status: "quota" | "rate"; retryAt: string }
  | { status: string };

/** Slack (px) for "scrolled to the very bottom"; the sentinel sits at the end of the page. */
const LOAD_DISTANCE = 48;
/** The top bar covers this much of the viewport; a chapter is "active" once its top passes it. */
const ACTIVE_OFFSET = 96;
/** Chapters further than this many viewport heights away keep their size but drop their DOM. */
const RENDER_MARGIN_SCREENS = 2;
/** At most this many chapters keep their text in page memory; the farthest is released first. */
export const MAX_CACHED = 30;

/**
 * Continuous reading: appends the next chapter when the reader reaches the end.
 *
 * Quota (docs/ARCHITECTURE.md §4.3): every request for chapter text counts, so a chapter is
 * only requested after the reader's own input (wheel, touch, key, pointer) reaches the end of
 * the loaded text — never on page load or after a programmatic progress restore — and only
 * one chapter ahead. Chapters scrolled far away keep their text here and only drop their DOM
 * (no new request when scrolling back); text released past MAX_CACHED is only fetched again
 * when the reader explicitly asks.
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
  const continuous = usePrefs()?.readingMode === "continuous";
  const [chapters, setChapters] = useState<StreamChapter[]>([]);
  // Which appended chapters have DOM, and the last measured height of every chapter.
  const [view, setView] = useState<{
    rendered: ReadonlySet<number>;
    heights: ReadonlyMap<number, number>;
  }>({ rendered: new Set(), heights: new Map() });
  const [state, setState] = useState<StreamState>({ kind: "idle" });
  const [reloading, setReloading] = useState<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const armed = useRef(false);
  const inFlight = useRef(new Set<number>());
  const activePosition = useRef(initial.position);

  const showChapter = (position: number) =>
    setView((current) => ({ ...current, rendered: new Set(current.rendered).add(position) }));

  const last = chapters.at(-1) ?? initial;
  const nextPosition = last.next;

  const request = useCallback(
    async (position: number): Promise<ChapterResponse | null> => {
      if (inFlight.current.has(position)) return null;
      inFlight.current.add(position);
      try {
        const response = await fetch(`/api/v1/works/${workId}/chapters/${position}`);
        return (
          ((await response.json().catch(() => null)) as ChapterResponse | null) ?? {
            status: "failed",
          }
        );
      } catch {
        return { status: "failed" };
      } finally {
        inFlight.current.delete(position);
      }
    },
    [workId],
  );

  const loadNext = useCallback(async () => {
    if (nextPosition === null || chapters.some((c) => c.position === nextPosition)) return;
    armed.current = false;
    setState({ kind: "loading" });
    const data = await request(nextPosition);
    if (!data) return;
    if (data.status === "ok" && "chapter" in data) {
      setChapters((current) => {
        const appended = [...current, { ...data.chapter, paragraphs: data.paragraphs }];
        // Keep page memory bounded: release the text farthest from where the reader is.
        const cached = appended.filter((c) => c.paragraphs !== null);
        if (cached.length <= MAX_CACHED) return appended;
        const farthest = cached.reduce((a, b) =>
          Math.abs(a.position - activePosition.current) >=
          Math.abs(b.position - activePosition.current)
            ? a
            : b,
        );
        return appended.map((c) =>
          c.position === farthest.position ? { ...c, paragraphs: null } : c,
        );
      });
      showChapter(data.chapter.position);
      setState({ kind: "idle" });
    } else if ((data.status === "quota" || data.status === "rate") && "retryAt" in data) {
      setState({ kind: "limited", reason: data.status, retryAt: data.retryAt });
    } else {
      setState({ kind: "failed" });
    }
  }, [chapters, nextPosition, request]);

  /** A released chapter is fetched again only on the reader's explicit request (counts quota). */
  const reload = async (position: number) => {
    setReloading(position);
    const data = await request(position);
    setReloading(null);
    if (data?.status === "ok" && "chapter" in data) {
      setChapters((current) =>
        current.map((c) => (c.position === position ? { ...c, paragraphs: data.paragraphs } : c)),
      );
      showChapter(position);
    } else if ((data?.status === "quota" || data?.status === "rate") && data && "retryAt" in data) {
      setState({ kind: "limited", reason: data.status, retryAt: data.retryAt });
    }
  };

  useEffect(() => {
    let frame = 0;
    const check = () => {
      frame = 0;
      const sections = document.querySelectorAll<HTMLElement>("[data-chapter-position]");

      // 1. Which chapter is the reader in? Keep URL, title, chrome, and progress in step.
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

      // 2. Virtualize: only chapters near the viewport keep their DOM; the rest keep their height.
      const margin = window.innerHeight * RENDER_MARGIN_SCREENS;
      const near = new Set<number>();
      const measured = new Map<number, number>();
      for (const section of sections) {
        if (!section.dataset.stream) continue;
        const position = Number(section.dataset.chapterPosition);
        const rect = section.getBoundingClientRect();
        if (section.dataset.rendered) measured.set(position, rect.height);
        if (rect.bottom > -margin && rect.top < window.innerHeight + margin) near.add(position);
      }
      setView((current) => {
        if (current.rendered.size === near.size && [...near].every((p) => current.rendered.has(p)))
          return current;
        // Freeze the height of chapters about to lose their DOM so scrolling does not jump.
        const heights = new Map(current.heights);
        for (const [position, height] of measured) heights.set(position, height);
        return { rendered: near, heights };
      });

      // 3. Load the next chapter once the reader's own input reached the bottom.
      const sentinel = sentinelRef.current;
      if (
        !continuous ||
        !armed.current ||
        !sentinel ||
        state.kind !== "idle" ||
        nextPosition === null ||
        // The page's own chapter must have rendered successfully (its end nav exists).
        !document.querySelector("[data-chapter-end]") ||
        sentinel.getBoundingClientRect().top > window.innerHeight + LOAD_DISTANCE
      )
        return;
      void loadNext();
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    // Only the reader's own input arms loading; restoring saved progress scrolls programmatically.
    // Input also re-checks, so a short chapter that cannot scroll still continues on a swipe.
    const arm = () => {
      armed.current = true;
      schedule();
    };
    const inputs = ["wheel", "touchmove", "keydown", "pointerdown"] as const;
    for (const name of inputs) window.addEventListener(name, arm, { passive: true });
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      for (const name of inputs) window.removeEventListener(name, arm);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [chapters, continuous, initial, loadNext, nextPosition, state.kind, workId, workTitle]);

  return (
    <div className={styles.stream}>
      {chapters.map((chapter) => {
        const height = view.heights.get(chapter.position);
        const common = {
          className: styles.article,
          "data-chapter-position": chapter.position,
          "data-stream": "1",
          "aria-labelledby": `chapter-${chapter.position}`,
        };
        if (chapter.paragraphs === null) {
          return (
            <section key={chapter.position} {...common} style={{ minHeight: height }}>
              <div className={styles.released} role="note">
                <h2 id={`chapter-${chapter.position}`}>{chapter.title}</h2>
                <p>{t("reader.releasedBody")}</p>
                <button
                  type="button"
                  className={styles.button}
                  disabled={reloading === chapter.position}
                  onClick={() => void reload(chapter.position)}
                >
                  {t("reader.releasedReload")}
                </button>
              </div>
            </section>
          );
        }
        if (!view.rendered.has(chapter.position) && height !== undefined) {
          return (
            <section key={chapter.position} {...common} style={{ height }} aria-hidden="true">
              <h2 id={`chapter-${chapter.position}`} className={styles.placeholderTitle}>
                {chapter.title}
              </h2>
            </section>
          );
        }
        return (
          <section key={chapter.position} {...common} data-rendered="1">
            <header className={styles.header}>
              {chapter.kind === "note" && (
                <p className={styles.noteBadge}>{t("reader.noteBadge")}</p>
              )}
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
        );
      })}
      <div ref={sentinelRef} className={styles.streamStatus} aria-live="polite">
        {state.kind === "loading" && <p className={styles.meta}>{t("reader.autoLoading")}</p>}
        {state.kind === "failed" && (
          <p className={styles.meta}>
            {t("reader.autoFailed")}{" "}
            <button
              type="button"
              className={styles.inlineButton}
              onClick={() => {
                setState({ kind: "idle" });
                armed.current = true;
                void loadNext();
              }}
            >
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
