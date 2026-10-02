import type { Metadata } from "next";
import { Suspense } from "react";
import { AppearanceSettings } from "@/components/settings/appearance-settings";
import { t } from "@/i18n";
import { DeviceSettings } from "../signed-in";

export const metadata: Metadata = { title: t("settings.appearance") };

export default function AppearanceSettingsPage() {
  return (
    <Suspense fallback={<p>{t("common.loading")}</p>}>
      <DeviceSettings>{(signedIn) => <AppearanceSettings signedIn={signedIn} />}</DeviceSettings>
    </Suspense>
  );
}
