import { t } from "@/i18n";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <span className={styles.brand}>
            <span className={styles.brandMark} aria-hidden="true">
              續
            </span>
            {t("site.name")}
          </span>
        </div>
      </header>
      <main id="main" className={styles.main}>
        <p className={styles.eyebrow}>Xuye</p>
        <h1 className={styles.title}>{t("home.buildingTitle")}</h1>
        <p className={styles.body}>{t("home.buildingBody")}</p>
      </main>
    </>
  );
}
