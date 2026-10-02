"use client";

import Link from "next/link";
import { usePrefs } from "@/components/use-prefs";
import { t } from "@/i18n";
import styles from "./reader.module.css";

/**
 * End of a chapter, shared by the page's chapter and auto-loaded ones. Paged reading (and
 * readers who have not chosen yet) gets previous/next buttons; continuous reading only gets a
 * divider because the next chapter follows on its own.
 */
export function ChapterEnd({
  workId,
  position,
  title,
  prev,
  next,
}: {
  workId: number;
  position: number;
  title: string;
  prev: number | null;
  next: number | null;
}) {
  const continuous = usePrefs()?.readingMode === "continuous";

  if (continuous && next !== null) {
    return (
      <nav
        className={`${styles.end} ${styles.endSlim}`}
        aria-label={t("reader.chapterNav")}
        data-chapter-end={position}
      >
        <p className={styles.meta}>{t("reader.endOf", { title })}</p>
      </nav>
    );
  }

  return (
    <nav className={styles.end} aria-label={t("reader.chapterNav")} data-chapter-end={position}>
      <p className={styles.meta}>{t("reader.endOf", { title })}</p>
      {next === null && <h2 className={styles.caughtUp}>{t("reader.caughtUp")}</h2>}
      <div className={styles.endActions}>
        {next === null && continuous ? null : prev !== null ? (
          <Link
            className={styles.button}
            href={`/works/${workId}/chapters/${prev}`}
            rel="prev"
            prefetch={false}
          >
            ← {t("reader.prev")}
          </Link>
        ) : (
          <span className={styles.buttonDisabled} aria-disabled="true">
            ← {t("reader.prev")}
          </span>
        )}
        {next !== null ? (
          <Link
            className={styles.primary}
            href={`/works/${workId}/chapters/${next}`}
            rel="next"
            prefetch={false}
          >
            {t("reader.next")} →
          </Link>
        ) : (
          <Link className={styles.primary} href={`/works/${workId}`}>
            {t("reader.back")}
          </Link>
        )}
      </div>
    </nav>
  );
}
