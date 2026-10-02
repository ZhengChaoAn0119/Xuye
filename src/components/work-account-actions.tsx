"use client";

import Link from "next/link";
import { useState } from "react";
import { t } from "@/i18n";
import styles from "./work-account-actions.module.css";

type Props = {
  workId: number;
  signedIn: boolean;
  initialSaved: boolean;
  currentChapterPosition: number | null;
  startPosition: number | null;
  latestPosition: number | null;
};

export function WorkAccountActions(props: Props) {
  const [saved, setSaved] = useState(props.initialSaved);
  const toggle = async () => {
    const next = !saved;
    setSaved(next);
    const response = await fetch("/api/v1/me/bookshelf", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ workId: props.workId, saved: next }),
    });
    if (!response.ok) setSaved(!next);
  };
  const readingPosition = props.currentChapterPosition ?? props.startPosition;
  return (
    <div className={styles.actions}>
      {readingPosition !== null && (
        <Link
          className={styles.primary}
          href={`/works/${props.workId}/chapters/${readingPosition}`}
          prefetch={false}
        >
          {props.currentChapterPosition
            ? t("work.continueReading", { position: props.currentChapterPosition })
            : t("work.startReading")}
        </Link>
      )}
      {props.signedIn ? (
        <button
          className={saved ? styles.saved : styles.button}
          onClick={() => void toggle()}
          aria-pressed={saved}
        >
          {saved ? `♥ ${t("work.savedToLibrary")}` : `♡ ${t("work.saveToLibrary")}`}
        </button>
      ) : (
        <Link
          className={styles.button}
          href={`/signin?callbackUrl=${encodeURIComponent(`/works/${props.workId}`)}`}
        >
          {t("work.saveToLibrary")}
        </Link>
      )}
      {props.latestPosition !== null && props.latestPosition !== readingPosition && (
        <Link
          className={styles.button}
          href={`/works/${props.workId}/chapters/${props.latestPosition}`}
          prefetch={false}
        >
          {t("work.latestChapter")}
        </Link>
      )}
    </div>
  );
}
