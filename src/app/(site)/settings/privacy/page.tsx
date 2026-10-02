import type { Metadata } from "next";
import { Suspense } from "react";
import { PrivacySettings } from "@/components/settings/privacy-settings";
import { t } from "@/i18n";
import { SignedIn } from "../signed-in";

export const metadata: Metadata = { title: t("settings.privacy") };

export default function PrivacySettingsPage() {
  return (
    <Suspense fallback={<p>{t("common.loading")}</p>}>
      <SignedIn path="/settings/privacy">
        {(user) => <PrivacySettings email={user.email} isAdmin={user.role === "admin"} />}
      </SignedIn>
    </Suspense>
  );
}
