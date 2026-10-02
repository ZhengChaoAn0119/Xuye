import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AccountPreferences } from "@/components/account-preferences";
import { t } from "@/i18n";
import { formatDateTime } from "@/lib/format";
import { requireUser } from "@/server/authz";
import { getDb } from "@/server/db";
import { getReadIdentity } from "@/server/request-identity";
import { getQuotaStatus } from "@/server/services/quota";
import { getAccountProfile, getReaderPreferences } from "@/server/services/reader-account";
import styles from "./account.module.css";

export const metadata: Metadata = { title: t("account.title"), robots: { index: false } };

async function AccountContent() {
  const user = await requireUser("/account");
  const identity = await getReadIdentity(user.id);
  const [profile, preferenceState, quota] = await Promise.all([
    getAccountProfile(getDb(), user.id),
    getReaderPreferences(getDb(), user.id),
    getQuotaStatus(getDb(), identity, new Date()),
  ]);
  if (!profile) return null;
  const label = profile.name || profile.email || t("account.title");

  return (
    <div className={styles.layout}>
      <aside className={styles.profile}>
        <span className={styles.avatar} aria-hidden="true">
          {label.slice(0, 1).toUpperCase()}
        </span>
        <h2>{label}</h2>
        <p>{profile.email}</p>
        <strong>{t("account.freeTier")}</strong>
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
          <h2>{t("account.overview")}</h2>
          <dl>
            <div>
              <dt>{t("account.joinedAt")}</dt>
              <dd>{formatDateTime(profile.createdAt)}</dd>
            </div>
            <div>
              <dt>{t("account.overview")}</dt>
              <dd>{t("account.syncStatus")}</dd>
            </div>
          </dl>
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
              <dt>24 小時</dt>
              <dd>
                {quota.resetAt
                  ? t("account.quotaResets", { time: formatDateTime(quota.resetAt) })
                  : t("account.quotaUnused")}
              </dd>
            </div>
          </dl>
        </section>
        <AccountPreferences
          initial={preferenceState.preferences}
          initiallyAgeVerified={Boolean(profile.ageVerifiedAt)}
        />
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
