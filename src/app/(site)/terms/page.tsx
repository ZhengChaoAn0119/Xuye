import type { Metadata } from "next";
import Link from "next/link";
import { t } from "@/i18n";
import { TERMS_VERSION } from "@/lib/terms";
import styles from "../privacy/privacy.module.css";

export const metadata: Metadata = { title: t("terms.title") };
const sections = [
  "service",
  "account",
  "quota",
  "content",
  "conduct",
  "data",
  "deletion",
  "availability",
  "changes",
  "law",
  "contact",
] as const;

export default function TermsPage() {
  return (
    <main id="main" className={styles.page}>
      <header className={styles.head}>
        <p>{t("terms.eyebrow")}</p>
        <h1>{t("terms.title")}</h1>
        <span>{t("terms.version", { version: TERMS_VERSION })}</span>
      </header>
      <article className={styles.article}>
        <p className={styles.intro}>{t("terms.intro")}</p>
        {sections.map((section) => (
          <section key={section}>
            <h2>{t(`terms.${section}Title`)}</h2>
            <p>{t(`terms.${section}Body`)}</p>
          </section>
        ))}
        <Link href="/privacy">{t("privacy.title")}</Link>
      </article>
    </main>
  );
}
