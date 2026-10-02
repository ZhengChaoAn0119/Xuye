"use client";

import { useState } from "react";
import { t } from "@/i18n";
import type { ReaderPreferences } from "@/server/services/reader-account";
import { Group, Row, Status, Toggle } from "./controls";
import styles from "./settings.module.css";

type ContentPrefs = Pick<ReaderPreferences, "showSexual" | "showViolence" | "showBadge">;

/** Content warnings and badge; account-only, saved straight to the server. */
export function ContentSettings({
  initial,
  initiallyAgeVerified,
}: {
  initial: ContentPrefs;
  initiallyAgeVerified: boolean;
}) {
  const [prefs, setPrefs] = useState(initial);
  const [ageVerified, setAgeVerified] = useState(initiallyAgeVerified);
  const [showAgeForm, setShowAgeForm] = useState(false);
  const [message, setMessage] = useState("");

  const save = async (patch: Partial<ContentPrefs>) => {
    const previous = prefs;
    setPrefs({ ...previous, ...patch });
    setMessage("");
    const response = await fetch("/api/v1/me/preferences", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    }).catch(() => null);
    if (!response?.ok) {
      setPrefs(previous);
      setMessage(t("account.saveFailed"));
    } else {
      setMessage(t("account.saved"));
    }
  };

  const toggleSexual = () => {
    if (!prefs.showSexual && !ageVerified) {
      setShowAgeForm(true);
      return;
    }
    void save({ showSexual: !prefs.showSexual });
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
    setPrefs((current) => ({ ...current, showSexual: true }));
    setMessage(t("account.saved"));
  };

  return (
    <div className={styles.stack}>
      <Group id="content-warnings" title={t("account.content")}>
        <Row label={t("account.sexual")} hint={t("account.sexualHint")}>
          <Toggle checked={prefs.showSexual} onClick={toggleSexual} label={t("account.sexual")} />
        </Row>
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
        <Row label={t("account.violence")} hint={t("account.violenceHint")}>
          <Toggle
            checked={prefs.showViolence}
            onClick={() => void save({ showViolence: !prefs.showViolence })}
            label={t("account.violence")}
          />
        </Row>
      </Group>
      <Group id="content-badge" title={t("settings.publicProfile")}>
        <Row label={t("account.badge")} hint={t("account.badgeHint")}>
          <Toggle
            checked={prefs.showBadge}
            onClick={() => void save({ showBadge: !prefs.showBadge })}
            label={t("account.badge")}
          />
        </Row>
      </Group>
      <Status message={message} />
    </div>
  );
}
