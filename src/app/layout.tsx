import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { AccountPreferenceSync } from "@/components/account-preference-sync";
import { SITE_BOOT_SCRIPT } from "@/components/reader-prefs";
import { defaultLocale, t } from "@/i18n";
import { getCurrentUser } from "@/server/authz";
import { getDb } from "@/server/db";
import { getReaderPreferences } from "@/server/services/reader-account";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: t("site.name"), template: `%s｜${t("site.name")}` },
  description: t("site.description"),
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f5" },
    { media: "(prefers-color-scheme: dark)", color: "#16171a" },
  ],
};

async function PreferenceSyncSlot() {
  const user = await getCurrentUser();
  if (!user) return null;
  const state = await getReaderPreferences(getDb(), user.id);
  return <AccountPreferenceSync {...state} />;
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The reader's boot script sets data-reader-theme/--reader-size on <html> before hydration.
    <html lang={defaultLocale} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: SITE_BOOT_SCRIPT }} />
        <a className="skip-link" href="#main">
          {t("a11y.skipToContent")}
        </a>
        <Suspense fallback={null}>
          <PreferenceSyncSlot />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
