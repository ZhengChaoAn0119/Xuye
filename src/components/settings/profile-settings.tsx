"use client";

import { useState } from "react";
import { t } from "@/i18n";
import { DISPLAY_NAME_LENGTH } from "@/lib/display-name";
import { Group, Row, Status } from "./controls";
import styles from "./settings.module.css";

/** Profile: display name (paid members only), email, tier, and join date. */
export function ProfileSettings({
  displayName,
  email,
  tierLabel,
  joinedAt,
  canChangeName,
}: {
  displayName: string;
  email: string | null;
  tierLabel: string;
  joinedAt: string;
  canChangeName: boolean;
}) {
  const [message, setMessage] = useState("");
  const saveName = async (formData: FormData) => {
    const response = await fetch("/api/v1/me/profile", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: String(formData.get("name") ?? "") }),
    }).catch(() => null);
    setMessage(response?.ok ? t("account.saved") : t("settings.displayNameInvalid"));
  };

  return (
    <div className={styles.stack}>
      <Group id="profile-name" title={t("settings.displayName")}>
        <form action={saveName} className={styles.field}>
          <label htmlFor="display-name">{t("settings.displayName")}</label>
          <div className={styles.fieldRow}>
            <input
              id="display-name"
              name="name"
              defaultValue={displayName}
              minLength={DISPLAY_NAME_LENGTH.min}
              maxLength={DISPLAY_NAME_LENGTH.max}
              disabled={!canChangeName}
              aria-describedby="display-name-hint"
              required
            />
            {canChangeName && <button>{t("common.save")}</button>}
          </div>
          <small id="display-name-hint">
            {canChangeName ? t("settings.displayNameHint") : t("settings.displayNamePaid")}
          </small>
        </form>
      </Group>
      <Status message={message} />
      <Group id="profile-account" title={t("settings.accountInfo")}>
        <Row label={t("auth.email")}>
          <span className={styles.value}>{email}</span>
        </Row>
        <Row label={t("settings.tier")}>
          <span className={styles.value}>{tierLabel}</span>
        </Row>
        <Row label={t("account.joinedAt")}>
          <span className={styles.value}>{joinedAt}</span>
        </Row>
      </Group>
    </div>
  );
}
