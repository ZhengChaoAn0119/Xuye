import type { Metadata, Route } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { emailSignIn, googleSignIn } from "@/app/auth-actions";
import { t } from "@/i18n";
import { safeCallbackUrl } from "@/lib/auth";
import { authProviderAvailability } from "@/server/auth-providers";
import { getCurrentUser } from "@/server/authz";
import { serverEnv } from "@/env";
import styles from "./signin.module.css";

export const metadata: Metadata = { title: t("auth.signInTitle"), robots: { index: false } };

async function SignInPanel({ searchParams }: Pick<PageProps<"/signin">, "searchParams">) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(
    Array.isArray(params.callbackUrl) ? params.callbackUrl[0] : params.callbackUrl,
  );
  if (await getCurrentUser()) redirect(callbackUrl as Route);
  const providers = authProviderAvailability(serverEnv());

  return (
    <section className={styles.card} aria-labelledby="signin-title">
      <p className={styles.eyebrow}>{t("auth.eyebrow")}</p>
      <h1 id="signin-title">{t("auth.signInTitle")}</h1>
      <p className={styles.intro}>{t("auth.signInIntro")}</p>
      {providers.google && (
        <form action={googleSignIn.bind(null, callbackUrl)}>
          <button className={styles.provider}>{t("auth.google")}</button>
        </form>
      )}
      {providers.email && (
        <>
          {providers.google && <div className={styles.divider}>{t("auth.orEmail")}</div>}
          <form action={emailSignIn.bind(null, callbackUrl)} className={styles.form}>
            <label htmlFor="email">{t("auth.email")}</label>
            <input id="email" name="email" type="email" autoComplete="email" required />
            <button className={styles.primary}>{t("auth.sendLink")}</button>
          </form>
        </>
      )}
      {!providers.email && !providers.google && (
        <p className={styles.notice}>{t("auth.unavailable")}</p>
      )}
      <p className={styles.note}>{t("auth.syncNote")}</p>
    </section>
  );
}

export default function SignInPage(props: PageProps<"/signin">) {
  return (
    <main id="main" className={styles.page}>
      <Suspense fallback={<div className={styles.card}>{t("common.loading")}</div>}>
        <SignInPanel searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
