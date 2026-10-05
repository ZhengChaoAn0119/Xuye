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
import { TermsChoice } from "@/components/terms-choice";
import { consentUrl } from "@/lib/terms";

export const metadata: Metadata = { title: t("auth.signInTitle"), robots: { index: false } };

async function SignInPanel({ searchParams }: Pick<PageProps<"/signin">, "searchParams">) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(
    Array.isArray(params.callbackUrl) ? params.callbackUrl[0] : params.callbackUrl,
  );
  const user = await getCurrentUser();
  if (user) redirect((user.termsAccepted ? callbackUrl : consentUrl(callbackUrl)) as Route);
  const providers = authProviderAvailability(serverEnv());

  return (
    <section className={styles.card} aria-labelledby="signin-title">
      <p className={styles.eyebrow}>{t("auth.eyebrow")}</p>
      <h1 id="signin-title">{t("auth.signInTitle")}</h1>
      <p className={styles.intro}>{t("auth.signInIntro")}</p>
      {params.consent === "declined" && (
        <p className={styles.notice} role="alert">
          {t("terms.declined")}
        </p>
      )}
      {(providers.email || providers.google) && (
        <form
          action={
            providers.email
              ? emailSignIn.bind(null, callbackUrl)
              : googleSignIn.bind(null, callbackUrl)
          }
          className={styles.form}
        >
          {providers.email && (
            <>
              <label htmlFor="email">{t("auth.email")}</label>
              <input id="email" name="email" type="email" autoComplete="email" required />
            </>
          )}
          <TermsChoice defaultAgreed={params.consent !== "declined"} />
          {providers.email && <button className={styles.primary}>{t("auth.sendLink")}</button>}
          {providers.google && (
            <>
              {providers.email && <div className={styles.divider}>{t("auth.orGoogle")}</div>}
              <button
                className={styles.provider}
                formAction={googleSignIn.bind(null, callbackUrl)}
                formNoValidate
              >
                {t("auth.google")}
              </button>
            </>
          )}
        </form>
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
