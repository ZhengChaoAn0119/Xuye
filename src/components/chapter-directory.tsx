"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { t } from "@/i18n";
import styles from "./chapter-directory.module.css";
import { savePrefs } from "./reader-prefs";
import { usePrefs } from "./use-prefs";

export type DirectoryItem = { position: number; title: string; isNote: boolean; date: string };

const COLLAPSED = 60;

export function ChapterDirectory({ workId, items }: { workId: number; items: DirectoryItem[] }) {
  const newestFirst = usePrefs()?.directoryOrder === "newest";
  const setNewestFirst = (toggle: (value: boolean) => boolean) =>
    savePrefs({ directoryOrder: toggle(newestFirst) ? "newest" : "oldest" });
  const [expanded, setExpanded] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // The directory streams in after navigation, so a #directory link may arrive before it exists.
  useEffect(() => {
    if (window.location.hash === "#directory") sectionRef.current?.scrollIntoView();
  }, []);
  const ordered = newestFirst ? [...items].reverse() : items;
  const shown = expanded ? ordered : ordered.slice(0, COLLAPSED);

  return (
    <section
      ref={sectionRef}
      id="directory"
      className={styles.section}
      aria-labelledby="directory-heading"
    >
      <div className={styles.head}>
        <h2 id="directory-heading">{t("work.directory")}</h2>
        <button type="button" className={styles.sort} onClick={() => setNewestFirst((v) => !v)}>
          ⇅ {newestFirst ? t("work.sortNewest") : t("work.sortOldest")}
        </button>
      </div>
      <ol className={styles.list}>
        {shown.map((item) => (
          <li key={item.position}>
            <Link
              href={`/works/${workId}/chapters/${item.position}`}
              className={styles.item}
              prefetch={false}
            >
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
