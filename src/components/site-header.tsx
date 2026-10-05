import Link from "next/link";
import { Suspense } from "react";
import { t } from "@/i18n";
import { displayNameFor } from "@/lib/display-name";
import { getCurrentUser } from "@/server/authz";
import { consentUrl } from "@/lib/terms";
import { AccountMenu } from "./account-menu";
import styles from "./site-header.module.css";
import { SiteNav } from "./site-nav";
import { ThemePicker } from "./theme-picker";

async function AccountSlot() {
  const user = await getCurrentUser();
  return (
    <>
      <ThemePicker signedIn={Boolean(user?.termsAccepted)} />
      {user && !user.termsAccepted ? (
        <Link className={styles.account} href={consentUrl("/account")}>
          {t("terms.confirmTitle")}
        </Link>
      ) : user ? (
        <AccountMenu
          name={displayNameFor(user)}
          email={user.email}
          isAdmin={user.role === "admin"}
        />
      ) : (
        // Auth.js endpoints are route handlers, not pages: they need full navigations and must
        // never be prefetched by <Link> (prefetching sign-out could end the session).
        <a className={styles.account} href="/signin">
          {t("nav.signIn")}
        </a>
      )}
    </>
  );
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
        <div className={styles.actions}>
          <Suspense fallback={<span className={styles.accountPlaceholder} />}>
            <AccountSlot />
          </Suspense>
        </div>
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
          {t("site.tagline")}・<Link href="/settings">{t("settings.title")}</Link>・
          <Link href="/privacy">{t("site.privacy")}</Link>・
          <Link href="/terms">{t("terms.title")}</Link>
        </span>
      </div>
    </footer>
  );
}
