import Link from "next/link";
import { Suspense } from "react";
import { t } from "@/i18n";
import { getCurrentUser } from "@/server/authz";
import { AccountMenu } from "./account-menu";
import styles from "./site-header.module.css";
import { SiteNav } from "./site-nav";

async function AccountSlot() {
  const user = await getCurrentUser();
  // Auth.js endpoints are route handlers, not pages: they need full navigations and must
  // never be prefetched by <Link> (prefetching sign-out could end the session).
  if (!user) {
    return (
      <a className={styles.account} href="/signin">
        {t("nav.signIn")}
      </a>
    );
  }
  return <AccountMenu email={user.email} isAdmin={user.role === "admin"} />;
}

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.primary}>
        <Link className={styles.brand} href="/">
          <span className={styles.brandMark} aria-hidden="true">
            續
          </span>
          {t("site.name")}
        </Link>
        <form className={styles.search} action="/search" role="search">
          <input
            name="q"
            type="search"
            aria-label={t("nav.search")}
            placeholder={t("nav.searchPlaceholder")}
            className={styles.searchInput}
          />
          <button className={styles.searchButton} aria-label={t("nav.search")}>
            ⌕
          </button>
        </form>
        <Suspense fallback={<span className={styles.accountPlaceholder} />}>
          <AccountSlot />
        </Suspense>
      </div>
      <SiteNav
        label={t("a11y.mainNav")}
        latest={t("nav.latest")}
        library={t("nav.library")}
        history={t("nav.history")}
      />
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <span>{t("site.footer")}</span>
        <span>
          {t("site.tagline")}・<Link href="/privacy">{t("site.privacy")}</Link>
        </span>
      </div>
    </footer>
  );
}
