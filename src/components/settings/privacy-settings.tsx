"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { t } from "@/i18n";
import { Group, Row, Status } from "./controls";
import styles from "./settings.module.css";

/** Download my data and delete my account (retyping the email confirms the deletion). */
export function PrivacySettings({ email, isAdmin }: { email: string | null; isAdmin: boolean }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const remove = async (formData: FormData) => {
    setBusy(true);
    const response = await fetch("/api/v1/me", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ confirmEmail: String(formData.get("confirmEmail") ?? "") }),
    }).catch(() => null);
    setBusy(false);
    if (response?.ok) {
      // The session went with the account; refresh so no signed-in UI remains.
      router.replace("/");
      router.refresh();
      return;
    }
    setMessage(
      response?.status === 400
        ? t("settings.deleteMismatch")
        : response?.status === 403
          ? t("settings.deleteAdmin")
          : t("account.saveFailed"),
    );
  };

  return (
    <div className={styles.stack}>
      <Group id="privacy-export" title={t("settings.exportTitle")}>
        <Row label={t("settings.exportTitle")} hint={t("settings.exportHint")}>
          <a className={styles.linkButton} href="/api/v1/me/export" download>
            {t("settings.exportAction")}
          </a>
        </Row>
      </Group>
      <Group id="privacy-delete" title={t("settings.deleteTitle")}>
        <Row label={t("settings.deleteTitle")} hint={t("settings.deleteHint")}>
          <button
            type="button"
            className={styles.dangerButton}
            onClick={() => setConfirming(true)}
            disabled={isAdmin}
          >
            {t("settings.deleteAction")}
          </button>
        </Row>
        {isAdmin && <p className={styles.note}>{t("settings.deleteAdmin")}</p>}
        {confirming && !isAdmin && (
          <form action={remove} className={styles.dangerForm}>
            <label htmlFor="confirmEmail">
              {t("settings.deleteConfirm", { email: email ?? "" })}
            </label>
            <input id="confirmEmail" name="confirmEmail" type="email" autoComplete="off" required />
            <div className={styles.fieldRow}>
              <button className={styles.dangerButton} disabled={busy}>
                {t("settings.deleteFinal")}
              </button>
              <button type="button" onClick={() => setConfirming(false)}>
                {t("common.cancel")}
              </button>
            </div>
          </form>
        )}
      </Group>
      <Status message={message} />
    </div>
  );
}
