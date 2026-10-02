import type { Metadata } from "next";
import Link from "next/link";
import { t } from "@/i18n";
import styles from "../signin/signin.module.css";

export const metadata: Metadata = { title: t("auth.checkEmailTitle"), robots: { index: false } };

export default function VerifyRequestPage() {
  return (
    <main id="main" className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>{t("auth.eyebrow")}</p>
        <h1>{t("auth.checkEmailTitle")}</h1>
        <p className={styles.intro}>{t("auth.checkEmailBody")}</p>
        <div className={styles.form}>
          <Link className={styles.primary} href="/signin">
            {t("auth.otherEmail")}
          </Link>
          <Link className={styles.provider} href="/">
            {t("auth.backHome")}
          </Link>
        </div>
      </section>
    </main>
  );
}
