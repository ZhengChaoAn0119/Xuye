"use client";

import { useEffect, useState } from "react";
import { t } from "@/i18n";
import type { ReaderPreferences } from "@/server/services/reader-account";
import {
  applyPrefs,
  normalizePrefs,
  PALETTE_EVENT,
  READER_PREFS_KEY,
  type SitePalette,
} from "./reader-prefs";
import styles from "./account-preferences.module.css";

type Props = { initial: ReaderPreferences; initiallyAgeVerified: boolean };

function Toggle({
  checked,
  onClick,
  label,
}: {
  checked: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className={`${styles.toggle} ${checked ? styles.toggleOn : ""}`}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onClick}
    >
      <span />
    </button>
  );
}

export function AccountPreferences({ initial, initiallyAgeVerified }: Props) {
  const [preferences, setPreferences] = useState(initial);
  const [ageVerified, setAgeVerified] = useState(initiallyAgeVerified);
  const [showAgeForm, setShowAgeForm] = useState(false);
  const [message, setMessage] = useState("");

  // The header theme picker saves on its own; mirror its choice here.
  useEffect(() => {
    const onChange = (event: Event) => {
      const sitePalette = (event as CustomEvent<SitePalette>).detail;
      setPreferences((current) => ({ ...current, sitePalette }));
    };
    window.addEventListener(PALETTE_EVENT, onChange);
    return () => window.removeEventListener(PALETTE_EVENT, onChange);
  }, []);

  const syncLocalReader = (next: ReaderPreferences) => {
    const local = normalizePrefs({
      theme: next.readerTheme,
      palette: next.sitePalette,
      size: next.readerFontSize,
      font: next.readerFont,
      lineHeight: next.lineHeight,
      pageWidth: next.pageWidth,
      autoNext: next.autoNextChapter,
    });
    try {
      localStorage.setItem(READER_PREFS_KEY, JSON.stringify(local));
    } catch {}
    applyPrefs(local);
    window.dispatchEvent(new CustomEvent(PALETTE_EVENT, { detail: local.palette }));
  };

  const save = async (patch: Partial<ReaderPreferences>) => {
    const previous = preferences;
    const next = { ...previous, ...patch };
    setPreferences(next);
    syncLocalReader(next);
    setMessage("");
    const response = await fetch("/api/v1/me/preferences", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!response.ok) {
      setPreferences(previous);
      syncLocalReader(previous);
      setMessage(t("account.saveFailed"));
    } else {
      setMessage(t("account.saved"));
    }
  };

  const toggleSexual = () => {
    if (!preferences.showSexual && !ageVerified) {
      setShowAgeForm(true);
      return;
    }
    void save({ showSexual: !preferences.showSexual });
  };

  const verifyAge = async (formData: FormData) => {
    const response = await fetch("/api/v1/me/age-verification", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ birthDate: formData.get("birthDate") }),
    });
    if (!response.ok) {
      setMessage(response.status === 403 ? t("account.underage") : t("account.saveFailed"));
      return;
    }
    setAgeVerified(true);
    setShowAgeForm(false);
    setPreferences((current) => ({ ...current, showSexual: true }));
    setMessage(t("account.saved"));
  };

  return (
    <div className={styles.stack}>
      <section className={styles.group} aria-labelledby="reading-settings">
        <h2 id="reading-settings">{t("account.reading")}</h2>
        <div className={styles.setting}>
          <div>
            <strong>{t("account.palette")}</strong>
            <small>{t("account.paletteHint")}</small>
          </div>
          <div className={styles.paletteChoices}>
            {(["a1", "a2", "a3"] as const).map((palette) => (
              <button
                key={palette}
                className={preferences.sitePalette === palette ? styles.active : ""}
                onClick={() => void save({ sitePalette: palette })}
                aria-pressed={preferences.sitePalette === palette}
              >
                <span className={`${styles.paletteSwatch} ${styles[palette]}`} aria-hidden="true" />
                {t(`account.${palette}`)}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.setting}>
          <label htmlFor="font-size">{t("account.fontSize")}</label>
          <div className={styles.stepper}>
            <button
              onClick={() =>
                void save({ readerFontSize: Math.max(15, preferences.readerFontSize - 1) })
              }
            >
              A−
            </button>
            <output id="font-size">{preferences.readerFontSize}px</output>
            <button
              onClick={() =>
                void save({ readerFontSize: Math.min(26, preferences.readerFontSize + 1) })
              }
            >
              A＋
            </button>
          </div>
        </div>
        <div className={styles.setting}>
          <span>{t("account.theme")}</span>
          <div className={styles.segmented}>
            {(["sepia", "white", "dark"] as const).map((theme) => (
              <button
                key={theme}
                className={preferences.readerTheme === theme ? styles.active : ""}
                onClick={() => void save({ readerTheme: theme })}
              >
                {t(`account.${theme}`)}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.setting}>
          <span>{t("account.font")}</span>
          <div className={styles.segmented}>
            {(["serif", "sans"] as const).map((font) => (
              <button
                key={font}
                className={preferences.readerFont === font ? styles.active : ""}
                onClick={() => void save({ readerFont: font })}
              >
                {t(`account.${font}`)}
              </button>
            ))}
          </div>
        </div>
        <label className={styles.range}>
          <span>{t("account.lineHeight")}</span>
          <input
            type="range"
            min="150"
            max="260"
            step="5"
            value={preferences.lineHeight}
            onChange={(event) =>
              setPreferences((p) => ({ ...p, lineHeight: Number(event.target.value) }))
            }
            onPointerUp={() => void save({ lineHeight: preferences.lineHeight })}
            onKeyUp={() => void save({ lineHeight: preferences.lineHeight })}
          />
          <output>{(preferences.lineHeight / 100).toFixed(2)}</output>
        </label>
        <label className={styles.range}>
          <span>{t("account.pageWidth")}</span>
          <input
            type="range"
            min="560"
            max="920"
            step="20"
            value={preferences.pageWidth}
            onChange={(event) =>
              setPreferences((p) => ({ ...p, pageWidth: Number(event.target.value) }))
            }
            onPointerUp={() => void save({ pageWidth: preferences.pageWidth })}
            onKeyUp={() => void save({ pageWidth: preferences.pageWidth })}
          />
          <output>{preferences.pageWidth}px</output>
        </label>
        <div className={styles.setting}>
          <div>
            <strong>{t("account.autoNext")}</strong>
            <small>{t("account.autoNextHint")}</small>
          </div>
          <Toggle
            checked={preferences.autoNextChapter}
            onClick={() => void save({ autoNextChapter: !preferences.autoNextChapter })}
            label={t("account.autoNext")}
          />
        </div>
      </section>

      <section className={styles.group} aria-labelledby="content-settings">
        <h2 id="content-settings">{t("account.content")}</h2>
        <div className={styles.setting}>
          <div>
            <strong>{t("account.sexual")}</strong>
            <small>{t("account.sexualHint")}</small>
          </div>
          <Toggle
            checked={preferences.showSexual}
            onClick={toggleSexual}
            label={t("account.sexual")}
          />
        </div>
        {showAgeForm && (
          <form action={verifyAge} className={styles.ageForm}>
            <label htmlFor="birthDate">{t("account.birthDate")}</label>
            <input id="birthDate" name="birthDate" type="date" required />
            <button>{t("account.confirmAdult")}</button>
            <button type="button" onClick={() => setShowAgeForm(false)}>
              {t("common.cancel")}
            </button>
          </form>
        )}
        <div className={styles.setting}>
          <div>
            <strong>{t("account.violence")}</strong>
            <small>{t("account.violenceHint")}</small>
          </div>
          <Toggle
            checked={preferences.showViolence}
            onClick={() => void save({ showViolence: !preferences.showViolence })}
            label={t("account.violence")}
          />
        </div>
        <div className={styles.setting}>
          <div>
            <strong>{t("account.badge")}</strong>
            <small>{t("account.badgeHint")}</small>
          </div>
          <Toggle
            checked={preferences.showBadge}
            onClick={() => void save({ showBadge: !preferences.showBadge })}
            label={t("account.badge")}
          />
        </div>
      </section>
      <p className={styles.status} aria-live="polite">
        {message}
      </p>
    </div>
  );
}
