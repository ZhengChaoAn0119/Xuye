"use client";

import Link from "next/link";
import { useState } from "react";
import { t } from "@/i18n";
import styles from "./chapter-directory.module.css";

export type DirectoryItem = { position: number; title: string; isNote: boolean; date: string };

const COLLAPSED = 60;

export function ChapterDirectory({ workId, items }: { workId: number; items: DirectoryItem[] }) {
  const [newestFirst, setNewestFirst] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const ordered = newestFirst ? [...items].reverse() : items;
  const shown = expanded ? ordered : ordered.slice(0, COLLAPSED);

  return (
    <section aria-labelledby="directory-heading">
      <div className={styles.head}>
        <h2 id="directory-heading">{t("work.directory")}</h2>
        <button type="button" className={styles.sort} onClick={() => setNewestFirst((v) => !v)}>
          ⇅ {newestFirst ? t("work.sortNewest") : t("work.sortOldest")}
        </button>
      </div>
      <ol className={styles.list}>
        {shown.map((item) => (
          <li key={item.position}>
            <Link href={`/works/${workId}/chapters/${item.position}`} className={styles.item}>
              <span className={styles.itemTitle}>
                {item.isNote && <span className={styles.note}>{t("common.note")}</span>}
                {item.title}
              </span>
              <small>{item.date}</small>
            </Link>
          </li>
        ))}
      </ol>
      {!expanded && items.length > COLLAPSED && (
        <button type="button" className={styles.more} onClick={() => setExpanded(true)}>
          {t("work.showAll", { count: items.length })}
        </button>
      )}
    </section>
  );
}
