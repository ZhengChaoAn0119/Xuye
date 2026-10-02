"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { t } from "@/i18n";
import { SETTINGS_CATEGORIES } from "./categories";
import styles from "./settings-layout.module.css";

export function SettingsNav() {
  const pathname = usePathname();
  return (
    <nav className={styles.nav} aria-label={t("settings.title")}>
      {SETTINGS_CATEGORIES.map((category) => {
        const active = pathname === category.href;
        return (
          <Link
            key={category.href}
            href={category.href}
            className={active ? styles.active : undefined}
            aria-current={active ? "page" : undefined}
          >
            {t(category.label)}
          </Link>
        );
      })}
    </nav>
  );
}
