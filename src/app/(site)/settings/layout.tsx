import type { Metadata } from "next";
import { Suspense } from "react";
import { t } from "@/i18n";
import styles from "./settings-layout.module.css";
import { SettingsNav } from "./settings-nav";

export const metadata: Metadata = {
  title: {
    default: t("settings.title"),
    template: `%s｜${t("settings.title")}｜${t("site.name")}`,
  },
  robots: { index: false },
};

export default function SettingsLayout({ children }: LayoutProps<"/settings">) {
  return (
    <main id="main" className={styles.page}>
      <header className={styles.head}>
        <p>{t("settings.eyebrow")}</p>
        <h1>{t("settings.title")}</h1>
      </header>
      <div className={styles.layout}>
        {/* usePathname needs a Suspense boundary under Cache Components. */}
        <Suspense fallback={<nav className={styles.nav} />}>
          <SettingsNav />
        </Suspense>
        <div className={styles.content}>{children}</div>
      </div>
    </main>
  );
}
