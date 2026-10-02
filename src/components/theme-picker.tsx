"use client";

import { useEffect, useState } from "react";
import { t } from "@/i18n";
import {
  normalizePrefs,
  PALETTE_EVENT,
  READER_PREFS_KEY,
  setLocalPalette,
  SITE_PALETTES,
  type SitePalette,
} from "./reader-prefs";
import styles from "./theme-picker.module.css";
import { useDismissibleDetails } from "./use-dismissible-details";

function storedPalette(): SitePalette {
  try {
    return normalizePrefs(JSON.parse(localStorage.getItem(READER_PREFS_KEY) ?? "{}")).palette;
  } catch {
    return normalizePrefs(null).palette;
  }
}

/** Header popover that switches the site palette for visitors and signed-in readers alike. */
export function ThemePicker({ signedIn }: { signedIn: boolean }) {
  const detailsRef = useDismissibleDetails();
  const [palette, setPalette] = useState<SitePalette | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read device prefs after hydration
    setPalette(storedPalette());
    const onChange = (event: Event) => setPalette((event as CustomEvent<SitePalette>).detail);
    window.addEventListener(PALETTE_EVENT, onChange);
    return () => window.removeEventListener(PALETTE_EVENT, onChange);
  }, []);

  const choose = (next: SitePalette) => {
    const previous = palette ?? storedPalette();
    setLocalPalette(next);
    if (!signedIn || next === previous) return;
    void fetch("/api/v1/me/preferences", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sitePalette: next }),
    }).then((response) => {
      if (!response.ok) setLocalPalette(previous);
    });
  };

  return (
    <details ref={detailsRef} className={styles.picker}>
      <summary className={styles.summary} aria-label={t("theme.open")}>
        <span className={`${styles.chip} ${styles[palette ?? "a3"]}`} aria-hidden="true" />
        <span className={styles.label}>{t("theme.title")}</span>
      </summary>
      <div className={styles.dropdown}>
        <p className={styles.heading}>{t("theme.title")}</p>
        <p className={styles.hint}>{t("theme.hint")}</p>
        <div className={styles.options} role="group" aria-label={t("theme.title")}>
          {[...SITE_PALETTES].reverse().map((option) => (
            <button
              key={option}
              type="button"
              className={styles.option}
              aria-pressed={palette === option}
              onClick={() => choose(option)}
            >
              <span className={`${styles.preview} ${styles[option]}`} aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <span className={styles.text}>
                <strong>{t(`account.${option}`)}</strong>
                <small>{t(`theme.${option}Hint`)}</small>
              </span>
              <span className={styles.check} aria-hidden="true">
                {palette === option ? "✓" : ""}
              </span>
            </button>
          ))}
        </div>
      </div>
    </details>
  );
}
