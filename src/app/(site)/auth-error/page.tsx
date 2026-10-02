import type { Metadata } from "next";
import Link from "next/link";
import { t } from "@/i18n";
import styles from "../signin/signin.module.css";

export const metadata: Metadata = { title: t("auth.errorTitle"), robots: { index: false } };

export default function AuthErrorPage() {
  return (
    <main id="main" className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>{t("auth.eyebrow")}</p>
        <h1>{t("auth.errorTitle")}</h1>
        <p className={styles.intro}>{t("auth.errorBody")}</p>
        <Link className={styles.primary} href="/signin">
          {t("auth.tryAgain")}
        </Link>
      </section>
    </main>
  );
}
