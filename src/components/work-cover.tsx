import { t } from "@/i18n";
import styles from "./work-cover.module.css";

// Palettes taken from the A3 prototype covers: base color + highlight gradient.
const PALETTES = [
  ["#253862", "#d86552"],
  ["#446b66", "#192c31"],
  ["#62343f", "#a45a68"],
  ["#b66f4d", "#7ec6c0"],
  ["#d18b43", "#69442c"],
  ["#263e48", "#7696a0"],
  ["#7d2f31", "#361214"],
  ["#657d58", "#31452e"],
  ["#3f4a7a", "#9a7fbf"],
  ["#5a4636", "#c9a27a"],
  ["#2f5d50", "#c7d38c"],
  ["#4d3557", "#e0a3a9"],
] as const;

/** Stable palette for a work; the same work always gets the same cover. */
export function paletteFor(workId: number) {
  return PALETTES[Math.abs(workId) % PALETTES.length]!;
}

type WorkCoverProps = {
  workId: number;
  title: string;
  author?: string | null;
  size?: "card" | "detail" | "mini";
};

/** Generated typographic cover (no image storage). Uploaded covers come later. */
export function WorkCover({ workId, title, author, size = "card" }: WorkCoverProps) {
  const [base, accent] = paletteFor(workId);
  return (
    <div
      className={`${styles.cover} ${styles[size]}`}
      style={{ "--cover-base": base, "--cover-accent": accent } as React.CSSProperties}
      role="img"
      aria-label={t("cover.label", { title })}
    >
      {size !== "mini" && (
        <div className={styles.copy} aria-hidden="true">
          <strong className={styles.title}>{title}</strong>
          {author && size === "detail" && <small className={styles.author}>{author}</small>}
        </div>
      )}
    </div>
  );
}
