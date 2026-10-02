import Link from "next/link";
import { t } from "@/i18n";
import { SETTINGS_CATEGORIES } from "./categories";
import styles from "./settings-layout.module.css";

export default function SettingsIndexPage() {
  return (
    <div className={styles.cards}>
      {SETTINGS_CATEGORIES.map((category) => (
        <Link key={category.href} href={category.href} className={styles.card}>
          <strong>{t(category.label)}</strong>
          <small>{t(category.hint)}</small>
        </Link>
      ))}
    </div>
  );
}
