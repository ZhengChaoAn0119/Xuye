"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { t } from "@/i18n";
import type { WorkCardData } from "@/lib/work-card";
import { savePrefs, type WorksView } from "./reader-prefs";
import { usePrefs } from "./use-prefs";
import { WorkCover } from "./work-cover";
import styles from "./works-browser.module.css";

type StatusFilter = "all" | "ongoing" | "completed";
type View = WorksView;
const LEGACY_VIEW_KEY = "xuye:works-view";

/** Work grid/list with a status filter. Filtering is client-side over the cached list. */
export function WorksBrowser({
  works,
  showFilters = true,
}: {
  works: WorkCardData[];
  showFilters?: boolean;
}) {
  const [status, setStatus] = useState<StatusFilter>("all");
  const view: View = usePrefs()?.worksView ?? "grid";

  // One-time move of the older standalone key into the shared preferences.
  useEffect(() => {
    try {
      const legacy = localStorage.getItem(LEGACY_VIEW_KEY);
      if (legacy === "grid" || legacy === "list") savePrefs({ worksView: legacy });
      localStorage.removeItem(LEGACY_VIEW_KEY);
    } catch {
      // storage unavailable; keep the default
    }
  }, []);

  const changeView = (next: View) => savePrefs({ worksView: next });

  const shown = status === "all" ? works : works.filter((w) => w.status === status);
  const filters: [StatusFilter, string][] = [
    ["all", t("common.all")],
    ["ongoing", t("common.ongoing")],
    ["completed", t("common.completed")],
  ];

  return (
    <>
      {showFilters && (
        <div className={styles.toolbar}>
          <div className={styles.filters} role="group" aria-label={t("home.statusFilter")}>
            {filters.map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={status === value ? styles.filterActive : styles.filter}
                aria-pressed={status === value}
                onClick={() => setStatus(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className={styles.segmented}>
            <button
              type="button"
              aria-pressed={view === "grid"}
              className={view === "grid" ? styles.segmentActive : styles.segment}
              onClick={() => changeView("grid")}
              title={t("home.gridView")}
              aria-label={t("home.gridView")}
            >
              ▦
            </button>
            <button
              type="button"
              aria-pressed={view === "list"}
              className={view === "list" ? styles.segmentActive : styles.segment}
              onClick={() => changeView("list")}
              title={t("home.listView")}
              aria-label={t("home.listView")}
            >
              ☷
            </button>
          </div>
        </div>
      )}

      {shown.length === 0 ? (
        <p className={styles.empty}>{t("home.empty")}</p>
      ) : view === "grid" ? (
        <ul className={styles.grid}>
          {shown.map((w) => (
            <li key={w.id}>
              <Link href={`/works/${w.id}`} className={styles.card}>
                <WorkCover workId={w.id} title={w.title} author={w.author} />
                <h3 className={styles.cardTitle}>{w.title}</h3>
                <p className={styles.meta}>
                  <span>
                    {w.status === "completed" ? t("common.completed") : t("common.ongoing")}
                  </span>
                  <span>{t("common.chapters", { count: w.chapterCount })}</span>
                </p>
                {w.latest && <p className={styles.latest}>{w.latest.title}</p>}
                <p className={styles.updated}>{w.updated}</p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <ul className={styles.list}>
          {shown.map((w) => (
            <li key={w.id}>
              <Link href={`/works/${w.id}`} className={styles.row}>
                <WorkCover workId={w.id} title={w.title} size="mini" />
                <span className={styles.rowMain}>
                  <strong>{w.title}</strong>
                  <span>{w.latest?.title}</span>
                </span>
                <span className={styles.hideMobile}>{w.author ?? t("work.unknownAuthor")}</span>
                <span className={styles.hideMobile}>
                  {t("common.chapters", { count: w.chapterCount })}
                </span>
                <span>{w.updated}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
