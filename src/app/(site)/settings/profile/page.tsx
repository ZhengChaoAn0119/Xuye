import type { Metadata } from "next";
import { Suspense } from "react";
import { ProfileSettings } from "@/components/settings/profile-settings";
import { t } from "@/i18n";
import { canChangeDisplayName, displayNameFor } from "@/lib/display-name";
import { formatDateTime } from "@/lib/format";
import { getDb } from "@/server/db";
import { getAccountProfile } from "@/server/services/reader-account";
import { SignedIn } from "../signed-in";

export const metadata: Metadata = { title: t("settings.profile") };

export default function ProfileSettingsPage() {
  return (
    <Suspense fallback={<p>{t("common.loading")}</p>}>
      <SignedIn path="/settings/profile">
        {async (user) => {
          const profile = await getAccountProfile(getDb(), user.id);
          if (!profile) return null;
          return (
            <ProfileSettings
              displayName={displayNameFor(profile)}
              email={profile.email}
              tierLabel={t(user.role === "admin" ? "account.adminRole" : "account.freeTier")}
              joinedAt={formatDateTime(profile.createdAt)}
              canChangeName={canChangeDisplayName(profile.tier)}
            />
          );
        }}
      </SignedIn>
    </Suspense>
  );
}
