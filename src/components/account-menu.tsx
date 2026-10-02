"use client";

import Link from "next/link";
import { signOutAction } from "@/app/auth-actions";
import { t } from "@/i18n";
import styles from "./site-header.module.css";
import { useDismissibleDetails } from "./use-dismissible-details";

export function AccountMenu({
  name,
  email,
  isAdmin,
}: {
  name: string;
  email: string | null;
  isAdmin: boolean;
}) {
  const detailsRef = useDismissibleDetails();
  const initial = ([...name][0] ?? "?").toUpperCase();

  return (
    // A tap before hydration toggles the native open state; that is expected, not a mismatch.
    <details ref={detailsRef} className={styles.accountMenu} suppressHydrationWarning>
      <summary className={styles.accountSummary} aria-label={t("nav.accountMenu")}>
        <span className={styles.avatar} title={email ?? undefined} aria-hidden="true">
          {initial}
        </span>
        <span className={styles.accountLabel}>{t("nav.account")}</span>
        <span aria-hidden="true">⌄</span>
      </summary>
      <div className={styles.accountDropdown}>
        <span className={styles.accountEmail}>
          <strong>{name}</strong>
          {email}
        </span>
        <Link className={styles.account} href="/account">
          {t("nav.profile")}
        </Link>
        <Link className={styles.account} href="/settings/content">
          {t("nav.contentPrefs")}
        </Link>
        <Link className={styles.account} href="/settings">
          {t("settings.title")}
        </Link>
        {isAdmin && (
          <Link className={styles.account} href="/admin">
            {t("nav.admin")}
          </Link>
        )}
        <form action={signOutAction}>
          <button className={styles.accountButton}>{t("nav.signOut")}</button>
        </form>
      </div>
    </details>
  );
}
