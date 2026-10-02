"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { t } from "@/i18n";
import type { WorkCardData } from "@/lib/work-card";
import { WorkCover } from "./work-cover";
import styles from "./reader-collections.module.css";

export type LibraryEntry = {
  work: WorkCardData;
  state: "unread" | "new" | "done";
  currentChapterPosition: number | null;
};

type RemovedEntry = { entry: LibraryEntry; index: number };

export function LibraryList({ initial }: { initial: LibraryEntry[] }) {
  const [filter, setFilter] = useState<"all" | LibraryEntry["state"]>("all");
  const [items, setItems] = useState(initial);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [removed, setRemoved] = useState<RemovedEntry | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const visible = useMemo(
    () => (filter === "all" ? items : items.filter((entry) => entry.state === filter)),
    [filter, items],
  );

  const updateSaved = async (workId: number, saved: boolean) => {
    const response = await fetch("/api/v1/me/bookshelf", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ workId, saved }),
    });
    if (!response.ok) throw new Error("bookshelf_update_failed");
  };

  const remove = async (entry: LibraryEntry) => {
    const index = items.findIndex((item) => item.work.id === entry.work.id);
    setBusyId(entry.work.id);
    setItems((current) => current.filter((item) => item.work.id !== entry.work.id));
    try {
      await updateSaved(entry.work.id, false);
      setRemoved({ entry, index });
      setMessage(t("library.removed"));
    } catch {
      setItems((current) => {
        const restored = [...current];
        restored.splice(Math.max(0, index), 0, entry);
        return restored;
      });
      setMessage(t("library.updateFailed"));
    } finally {
      setBusyId(null);
    }
  };

  const undo = async () => {
    if (!removed) return;
    const pending = removed;
    setBusyId(pending.entry.work.id);
    try {
      await updateSaved(pending.entry.work.id, true);
      setItems((current) => {
        if (current.some((item) => item.work.id === pending.entry.work.id)) return current;
        const restored = [...current];
        restored.splice(Math.min(Math.max(0, pending.index), restored.length), 0, pending.entry);
        return restored;
      });
      setRemoved(null);
      setMessage(t("library.restored"));
    } catch {
      setMessage(t("library.updateFailed"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <p className={styles.count}>{t("library.count", { count: items.length })}</p>
      {message && (
        <div className={styles.feedback} role="status" aria-live="polite">
          <span>{message}</span>
          {removed && (
            <button type="button" disabled={busyId !== null} onClick={() => void undo()}>
              {t("feedback.undo")}
            </button>
          )}
        </div>
      )}
      {items.length === 0 ? (
        <div className={styles.empty}>
          <h2>{t("library.empty")}</h2>
          <p>{t("library.emptyBody")}</p>
          <Link href="/">{t("nav.latest")}</Link>
        </div>
      ) : (
        <>
          <div className={styles.filters} aria-label={t("library.title")}>
            {(["all", "unread", "new", "done"] as const).map((key) => (
              <button
                key={key}
                className={filter === key ? styles.active : ""}
                onClick={() => setFilter(key)}
              >
                {key === "all" ? t("common.all") : t(`library.${key}`)}
              </button>
            ))}
          </div>
          <div className={styles.list}>
            {visible.map(({ work, state, currentChapterPosition }) => {
              const href = currentChapterPosition
                ? (`/works/${work.id}/chapters/${currentChapterPosition}` as const)
                : (`/works/${work.id}` as const);
              const entry = { work, state, currentChapterPosition };
              return (
                <article className={styles.row} key={work.id}>
                  <Link href={`/works/${work.id}`} className={styles.cover}>
                    <WorkCover
                      workId={work.id}
                      title={work.title}
                      author={work.author}
                      size="mini"
                    />
                  </Link>
                  <div className={styles.copy}>
                    <h2>
                      <Link href={`/works/${work.id}`}>{work.title}</Link>
                    </h2>
                    <p>{work.author}</p>
                    <span>{t(`library.${state}`)}</span>
                  </div>
                  <div className={styles.rowActions}>
                    <Link className={styles.continue} href={href} prefetch={false}>
                      {currentChapterPosition
                        ? t("work.continueReading", { position: currentChapterPosition })
                        : t("work.startReading")}
                    </Link>
                    <button
                      type="button"
                      disabled={busyId === work.id}
                      onClick={() => void remove(entry)}
                    >
                      {t("library.remove")}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
