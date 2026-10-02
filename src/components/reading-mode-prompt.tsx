"use client";

import { useEffect, useRef } from "react";
import { t } from "@/i18n";
import { type ReadingMode, setLocalPrefs, syncPrefs } from "./reader-prefs";
import styles from "./reading-mode-prompt.module.css";
import { usePrefs } from "./use-prefs";

/** Dismissing without a choice reads paged for this browser session and asks again next time. */
const DISMISSED_KEY = "xuye:reading-mode-dismissed";

function dismissedThisSession() {
  try {
    return sessionStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

/** Asks once, on first entering the reader, whether to read page by page or continuously. */
export function ReadingModePrompt({ signedIn }: { signedIn: boolean }) {
  const prefs = usePrefs();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const needsChoice = prefs !== null && prefs.readingMode === null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (needsChoice && !dismissedThisSession() && !dialog.open) dialog.showModal();
    // A choice arriving from the account (another device) closes the prompt.
    if (!needsChoice && dialog.open) dialog.close();
  }, [needsChoice]);

  const choose = (readingMode: ReadingMode) => {
    setLocalPrefs({ readingMode });
    if (signedIn) void syncPrefs({ readingMode });
    dialogRef.current?.close();
  };

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISSED_KEY, "1");
    } catch {}
  };

  const options: [ReadingMode, string, string][] = [
    ["paged", t("readingMode.paged"), t("readingMode.pagedBody")],
    ["continuous", t("readingMode.continuous"), t("readingMode.continuousBody")],
  ];

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="reading-mode-title"
      onCancel={dismiss}
    >
      <h2 id="reading-mode-title">{t("readingMode.title")}</h2>
      <p className={styles.intro}>{t("readingMode.intro")}</p>
      <div className={styles.options}>
        {options.map(([mode, label, body]) => (
          <button key={mode} type="button" className={styles.option} onClick={() => choose(mode)}>
            <span className={`${styles.figure} ${styles[mode]}`} aria-hidden="true">
              <span />
              <span />
            </span>
            <strong>{label}</strong>
            <small>{body}</small>
          </button>
        ))}
      </div>
      <p className={styles.note}>{t("readingMode.note")}</p>
      <form method="dialog">
        <button className={styles.later} onClick={dismiss}>
          {t("readingMode.later")}
        </button>
      </form>
    </dialog>
  );
}
