"use client";

import Link from "next/link";
import { useState } from "react";
import { t } from "@/i18n";
import { WorkCover } from "./work-cover";
import styles from "./reader-collections.module.css";

export type HistoryEntry = {
  workId: number;
  title: string;
  authorName: string | null;
  chapterPosition: number;
  chapterTitle: string;
  updatedAt: string;
};

export function HistoryList({ initial }: { initial: HistoryEntry[] }) {
  const [items, setItems] = useState(initial);
  const [removed, setRemoved] = useState<HistoryEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const remove = async (workId?: number) => {
    if (workId === undefined && !window.confirm(t("history.clearConfirm"))) return;
    const previous = items;
    const selected = workId === undefined ? items : items.filter((item) => item.workId === workId);
    setBusy(true);
    setItems((current) =>
      workId === undefined ? [] : current.filter((item) => item.workId !== workId),
    );
    try {
      const response = await fetch("/api/v1/me/history", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(workId ? { workId } : {}),
      });
      if (!response.ok) throw new Error("history_update_failed");
      setRemoved(selected);
      setMessage(t(workId === undefined ? "history.cleared" : "history.removed"));
    } catch {
      setItems(previous);
      setMessage(t("history.updateFailed"));
    } finally {
      setBusy(false);
    }
  };

  const undo = async () => {
    if (removed.length === 0) return;
    setBusy(true);
    try {
      const response = await fetch("/api/v1/me/history", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ workIds: removed.map((item) => item.workId) }),
      });
      if (!response.ok) throw new Error("history_restore_failed");
      const restoredIds = new Set(removed.map((item) => item.workId));
      setItems((current) => [
        ...removed,
        ...current.filter((item) => !restoredIds.has(item.workId)),
      ]);
      setRemoved([]);
      setMessage(t("history.restored"));
    } catch {
      setMessage(t("history.updateFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className={styles.actions}>
        <span>{t("history.count", { count: items.length })}</span>
        {items.length > 0 && (
          <button type="button" disabled={busy} onClick={() => void remove()}>
            {t("history.clear")}
          </button>
        )}
      </div>
      {message && (
        <div className={styles.feedback} role="status" aria-live="polite">
          <span>{message}</span>
          {removed.length > 0 && (
            <button type="button" disabled={busy} onClick={() => void undo()}>
              {t("feedback.undo")}
            </button>
          )}
        </div>
      )}
      {items.length === 0 ? (
        <div className={styles.empty}>
          <h2>{t("history.empty")}</h2>
          <p>{t("history.emptyBody")}</p>
          <Link href="/">{t("nav.latest")}</Link>
        </div>
      ) : (
        <div className={styles.list}>
          {items.map((item) => (
            <article className={styles.row} key={item.workId}>
              <Link href={`/works/${item.workId}`} className={styles.cover}>
                <WorkCover
                  workId={item.workId}
                  title={item.title}
                  author={item.authorName}
                  size="mini"
                />
              </Link>
              <div className={styles.copy}>
                <h2>
                  <Link href={`/works/${item.workId}`}>{item.title}</Link>
                </h2>
                <p>
                  {t("history.chapter", { position: item.chapterPosition })} · {item.chapterTitle}
                </p>
                <time dateTime={item.updatedAt}>
                  {new Intl.DateTimeFormat("zh-Hant", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(item.updatedAt))}
                </time>
              </div>
              <div className={styles.rowActions}>
                <Link
                  className={styles.continue}
                  href={`/works/${item.workId}/chapters/${item.chapterPosition}`}
                  prefetch={false}
                >
                  {t("history.continue")}
                </Link>
                <button type="button" disabled={busy} onClick={() => void remove(item.workId)}>
                  {t("common.remove")}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
