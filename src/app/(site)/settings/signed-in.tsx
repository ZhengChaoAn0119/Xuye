import Link from "next/link";
import type { ReactNode } from "react";
import { t } from "@/i18n";
import { getCurrentUser, type CurrentUser } from "@/server/authz";
import styles from "./settings-layout.module.css";
import { redirect } from "next/navigation";
import { consentUrl } from "@/lib/terms";

/** Renders an account-only settings section, or a sign-in prompt for visitors. */
export async function SignedIn({
  path,
  children,
}: {
  path: string;
  children: (user: CurrentUser) => Promise<ReactNode> | ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className={styles.signin}>
        <p>{t("settings.signInRequired")}</p>
        <Link href={`/signin?callbackUrl=${encodeURIComponent(path)}`}>{t("nav.signIn")}</Link>
      </div>
    );
  }
  if (!user.termsAccepted && path !== "/settings/privacy") redirect(consentUrl(path));
  return children(user);
}

/** Device-level sections work for visitors too; signed-in readers also sync. */
export async function DeviceSettings({ children }: { children: (signedIn: boolean) => ReactNode }) {
  const user = await getCurrentUser();
  return (
    <>
      {!user && <p className={styles.visitorNote}>{t("settings.visitorNote")}</p>}
      {children(Boolean(user?.termsAccepted))}
    </>
  );
}
