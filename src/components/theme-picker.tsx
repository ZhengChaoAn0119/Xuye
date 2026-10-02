"use client";

import { useEffect, useState } from "react";
import { t } from "@/i18n";
import {
  loadPrefs,
  PREFS_EVENT,
  type ReaderPrefs,
  setLocalPrefs,
  SITE_PALETTES,
  SITE_THEMES,
  syncPrefs,
} from "./reader-prefs";
import styles from "./theme-picker.module.css";
import { useDismissibleDetails } from "./use-dismissible-details";

/** Header popover: site palette and light/dark/system, for visitors and signed-in readers alike. */
export function ThemePicker({ signedIn }: { signedIn: boolean }) {
  const detailsRef = useDismissibleDetails();
  const [prefs, setPrefs] = useState<ReaderPrefs | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read device prefs after hydration
    setPrefs(loadPrefs());
    const onChange = (event: Event) => setPrefs((event as CustomEvent<ReaderPrefs>).detail);
    window.addEventListener(PREFS_EVENT, onChange);
    return () => window.removeEventListener(PREFS_EVENT, onChange);
  }, []);

  const choose = (patch: Partial<ReaderPrefs>) => {
    const previous = loadPrefs();
    setLocalPrefs(patch);
    if (!signedIn) return;
    void syncPrefs(patch).then((ok) => {
      if (!ok) setLocalPrefs(previous);
    });
  };

  const palette = prefs?.palette ?? "a3";
  return (
    // A tap before hydration toggles the native open state; that is expected, not a mismatch.
    <details ref={detailsRef} className={styles.picker} suppressHydrationWarning>
      <summary className={styles.summary} aria-label={t("theme.open")}>
        <span className={`${styles.chip} ${styles[palette]}`} aria-hidden="true" />
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
              aria-pressed={prefs ? prefs.palette === option : undefined}
              onClick={() => choose({ palette: option })}
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
                {prefs?.palette === option ? "✓" : ""}
              </span>
            </button>
          ))}
        </div>
        <div className={styles.modes} role="group" aria-label={t("theme.siteTheme")}>
          {SITE_THEMES.map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={prefs ? prefs.siteTheme === mode : undefined}
              onClick={() => choose({ siteTheme: mode })}
            >
              {t(`theme.${mode}`)}
            </button>
          ))}
        </div>
      </div>
    </details>
  );
}
