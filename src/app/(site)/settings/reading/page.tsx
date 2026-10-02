import type { Metadata } from "next";
import { Suspense } from "react";
import { ReadingSettings } from "@/components/settings/reading-settings";
import { t } from "@/i18n";
import { DeviceSettings } from "../signed-in";

export const metadata: Metadata = { title: t("settings.reading") };

export default function ReadingSettingsPage() {
  return (
    <Suspense fallback={<p>{t("common.loading")}</p>}>
      <DeviceSettings>{(signedIn) => <ReadingSettings signedIn={signedIn} />}</DeviceSettings>
    </Suspense>
  );
}
