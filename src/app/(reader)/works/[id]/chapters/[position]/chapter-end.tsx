import Link from "next/link";
import { t } from "@/i18n";
import styles from "./reader.module.css";

/** End-of-chapter navigation, shared by the page's chapter and auto-loaded ones. */
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
  return (
    <nav className={styles.end} aria-label={t("reader.chapterNav")} data-chapter-end={position}>
      <p className={styles.meta}>{t("reader.endOf", { title })}</p>
      {next === null && <h2 className={styles.caughtUp}>{t("reader.caughtUp")}</h2>}
      <div className={styles.endActions}>
        {prev !== null ? (
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
