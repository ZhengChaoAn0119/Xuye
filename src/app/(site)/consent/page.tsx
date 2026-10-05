import type { Metadata, Route } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { signOutAction } from "@/app/auth-actions";
import { TermsChoice } from "@/components/terms-choice";
import { PrivacySettings } from "@/components/settings/privacy-settings";
import { t } from "@/i18n";
import { safeCallbackUrl } from "@/lib/auth";
import { getCurrentUser } from "@/server/authz";
import styles from "../signin/signin.module.css";
import { confirmTerms } from "./actions";

export const metadata: Metadata = { title: t("terms.confirmTitle"), robots: { index: false } };

async function ConsentPanel({ searchParams }: Pick<PageProps<"/consent">, "searchParams">) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(
    Array.isArray(params.callbackUrl) ? params.callbackUrl[0] : params.callbackUrl,
  );
  const user = await getCurrentUser();
  if (!user) redirect(`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  if (user.termsAccepted) redirect(callbackUrl as Route);
  return (
    <section className={styles.card}>
      <h1>{t("terms.confirmTitle")}</h1>
      <p className={styles.intro}>{t("terms.confirmIntro")}</p>
      {params.declined && (
        <p className={styles.notice} role="alert">
          {t("terms.declined")}
        </p>
      )}
      <form action={confirmTerms.bind(null, callbackUrl)} className={styles.form}>
        <TermsChoice defaultAgreed={!params.declined} />
        <button className={styles.primary}>{t("terms.continue")}</button>
      </form>
      <form action={signOutAction}>
        <button className={styles.provider}>{t("terms.declineSignOut")}</button>
      </form>
      <p className={styles.note}>{t("terms.rightsNote")}</p>
      <PrivacySettings email={user.email} isAdmin={user.role === "admin"} />
    </section>
  );
}

export default function ConsentPage(props: PageProps<"/consent">) {
  return (
    <main id="main" className={styles.page}>
      <Suspense fallback={<div className={styles.card}>{t("common.loading")}</div>}>
        <ConsentPanel searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
