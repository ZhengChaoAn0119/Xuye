import { t } from "@/i18n";
import styles from "./works-browser.module.css";

/** Placeholder grid shown while a works list streams in. */
export function GridSkeleton() {
  return (
    <div className={styles.skeletonGrid} aria-busy="true" aria-label={t("common.loading")}>
      {Array.from({ length: 10 }, (_, i) => (
        <span key={i} />
      ))}
    </div>
  );
}
