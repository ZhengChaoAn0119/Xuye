import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { t } from "@/i18n";
import { displayNameFor } from "@/lib/display-name";
import { formatDateTime } from "@/lib/format";
import { requireUser } from "@/server/authz";
import { getDb } from "@/server/db";
import { getReadIdentity } from "@/server/request-identity";
import { getQuotaStatus } from "@/server/services/quota";
import { getAccountProfile } from "@/server/services/reader-account";
import { SETTINGS_CATEGORIES } from "../settings/categories";
import styles from "./account.module.css";

export const metadata: Metadata = { title: t("account.title"), robots: { index: false } };

/** 「我的」: who you are, today's allowance, shortcuts, and the way into each settings section. */
async function AccountContent() {
  const user = await requireUser("/account");
  const identity = await getReadIdentity(user.id);
  const [profile, quota] = await Promise.all([
    getAccountProfile(getDb(), user.id),
    getQuotaStatus(getDb(), identity, new Date()),
  ]);
  if (!profile) return null;
  const name = displayNameFor(profile);

  return (
    <div className={styles.layout}>
      <aside className={styles.profile}>
        <span className={styles.avatar} aria-hidden="true">
          {[...name][0]?.toUpperCase()}
        </span>
        <h2>{name}</h2>
        <p>{profile.email}</p>
        <strong>{t(user.role === "admin" ? "account.adminRole" : "account.freeTier")}</strong>
        <Link className={styles.profileLink} href="/settings/profile">
          {t("account.editProfile")}
        </Link>
      </aside>
      <div className={styles.content}>
        <section className={styles.overview}>
          <h2>{t("account.shortcuts")}</h2>
          <div className={styles.quickLinks}>
            <Link href="/library">{t("nav.library")}</Link>
            <Link href="/history">{t("nav.history")}</Link>
          </div>
        </section>
        <section className={styles.overview}>
          <h2>{t("account.quota")}</h2>
          <dl>
            <div>
              <dt>{t("account.quota")}</dt>
              <dd>
                {t("account.quotaRemaining", {
                  remaining: quota.remaining,
                  limit: quota.limit,
                })}
              </dd>
            </div>
            <div>
              <dt>{t("account.quotaWindow")}</dt>
              <dd>
                {quota.resetAt
                  ? t("account.quotaResets", { time: formatDateTime(quota.resetAt) })
                  : t("account.quotaUnused")}
              </dd>
            </div>
            <div>
              <dt>{t("account.quotaRule")}</dt>
              <dd>{t("account.quotaRuleBody", { minutes: quota.rereadGraceMinutes })}</dd>
            </div>
          </dl>
        </section>
        <section className={styles.overview}>
          <h2>{t("settings.title")}</h2>
          <div className={styles.settingsLinks}>
            {SETTINGS_CATEGORIES.map((category) => (
              <Link key={category.href} href={category.href}>
                <strong>{t(category.label)}</strong>
                <small>{t(category.hint)}</small>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <main id="main" className={styles.page}>
      <header className={styles.head}>
        <p>{t("account.eyebrow")}</p>
        <h1>{t("account.title")}</h1>
      </header>
      <Suspense fallback={<p>{t("common.loading")}</p>}>
        <AccountContent />
      </Suspense>
    </main>
  );
}
