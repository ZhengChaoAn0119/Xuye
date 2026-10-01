import Link from "next/link";
import { t } from "@/i18n";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <main id="main" className={styles.page}>
      <p className={styles.code}>404</p>
      <h1>{t("notFound.title")}</h1>
      <p>{t("notFound.body")}</p>
      <Link href="/" className={styles.button}>
        {t("notFound.home")}
      </Link>
    </main>
  );
}
