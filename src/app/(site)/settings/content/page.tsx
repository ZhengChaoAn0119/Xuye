import type { Metadata } from "next";
import { Suspense } from "react";
import { ContentSettings } from "@/components/settings/content-settings";
import { t } from "@/i18n";
import { getDb } from "@/server/db";
import { getAccountProfile, getReaderPreferences } from "@/server/services/reader-account";
import { SignedIn } from "../signed-in";

export const metadata: Metadata = { title: t("settings.content") };

export default function ContentSettingsPage() {
  return (
    <Suspense fallback={<p>{t("common.loading")}</p>}>
      <SignedIn path="/settings/content">
        {async (user) => {
          const [profile, { preferences }] = await Promise.all([
            getAccountProfile(getDb(), user.id),
            getReaderPreferences(getDb(), user.id),
          ]);
          return (
            <ContentSettings
              initial={{
                showSexual: preferences.showSexual,
                showViolence: preferences.showViolence,
                showBadge: preferences.showBadge,
              }}
              initiallyAgeVerified={Boolean(profile?.ageVerifiedAt)}
            />
          );
        }}
      </SignedIn>
    </Suspense>
  );
}
