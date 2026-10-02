"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { signOutAction } from "@/app/auth-actions";
import { t } from "@/i18n";
import styles from "./site-header.module.css";

export function AccountMenu({ email, isAdmin }: { email: string | null; isAdmin: boolean }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const initial = (email ?? "?").slice(0, 1).toUpperCase();

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      const details = detailsRef.current;
      if (details?.open && event.target instanceof Node && !details.contains(event.target)) {
        details.removeAttribute("open");
      }
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !detailsRef.current?.open) return;
      detailsRef.current.removeAttribute("open");
      detailsRef.current.querySelector("summary")?.focus();
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, []);

  return (
    <details ref={detailsRef} className={styles.accountMenu}>
      <summary className={styles.accountSummary} aria-label={t("nav.accountMenu")}>
        <span className={styles.avatar} title={email ?? undefined} aria-hidden="true">
          {initial}
        </span>
        <span className={styles.accountLabel}>{t("nav.account")}</span>
        <span aria-hidden="true">⌄</span>
      </summary>
      <div className={styles.accountDropdown}>
        <span className={styles.accountEmail}>{email}</span>
        <Link className={styles.account} href="/account">
          {t("nav.account")}
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
