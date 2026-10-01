import { chapterDisplayState } from "@/server/content/visibility";
import styles from "./admin.module.css";

const stateLabel = {
  draft: "草稿",
  scheduled: "排程",
  published: "已發布",
  hidden: "隱藏",
} as const;
const stateClass = {
  draft: "",
  scheduled: styles.badgeScheduled,
  published: styles.badgePublished,
  hidden: styles.badgeHidden,
} as const;

export function ChapterStateBadge(props: {
  status: "draft" | "published" | "hidden";
  publishAt: Date | null;
  now: Date;
}) {
  const state = chapterDisplayState(props, props.now);
  return <span className={`${styles.badge} ${stateClass[state]}`}>{stateLabel[state]}</span>;
}

export function KindBadge({ kind }: { kind: "chapter" | "note" }) {
  return kind === "note" ? (
    <span className={`${styles.badge} ${styles.badgeNote}`}>公告</span>
  ) : null;
}

export const workStatusLabel = { ongoing: "連載中", completed: "已完結" } as const;
