import type { Metadata } from "next";
import { t } from "@/i18n";
import styles from "./privacy.module.css";

export const metadata: Metadata = { title: t("privacy.title") };

const sections = ["account", "visitor", "cookie", "retention", "rights"] as const;

export default function PrivacyPage() {
  return (
    <main id="main" className={styles.page}>
      <header className={styles.head}>
        <p>{t("privacy.eyebrow")}</p>
        <h1>{t("privacy.title")}</h1>
        <span>{t("privacy.updated")}</span>
      </header>
      <article className={styles.article}>
        <p className={styles.intro}>{t("privacy.intro")}</p>
        {sections.map((section) => (
          <section key={section}>
            <h2>{t(`privacy.${section}Title`)}</h2>
            <p>{t(`privacy.${section}Body`)}</p>
          </section>
        ))}
      </article>
    </main>
  );
}
