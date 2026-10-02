"use client";

import { t } from "@/i18n";
import { SITE_PALETTES } from "../reader-prefs";
import { Group, Row, Segmented, Status, usePrefSettings } from "./controls";
import styles from "./settings.module.css";

/** Site palette, light/dark, and how lists are shown; works for visitors and members. */
export function AppearanceSettings({ signedIn }: { signedIn: boolean }) {
  const { prefs, update, message } = usePrefSettings(signedIn);

  return (
    <div className={styles.stack}>
      <Group id="appearance-theme" title={t("theme.title")}>
        <Row label={t("theme.title")} hint={t("account.paletteHint")}>
          <div className={styles.paletteChoices} role="group" aria-label={t("theme.title")}>
            {[...SITE_PALETTES].reverse().map((palette) => (
              <button
                key={palette}
                type="button"
                className={prefs?.palette === palette ? styles.active : ""}
                onClick={() => void update({ palette })}
                aria-pressed={prefs ? prefs.palette === palette : undefined}
              >
                <span className={`${styles.paletteSwatch} ${styles[palette]}`} aria-hidden="true" />
                {t(`account.${palette}`)}
              </button>
            ))}
          </div>
        </Row>
        <Row label={t("theme.siteTheme")} hint={t("settings.siteThemeHint")}>
          <Segmented
            label={t("theme.siteTheme")}
            value={prefs?.siteTheme}
            options={[
              ["light", t("theme.light")],
              ["dark", t("theme.dark")],
              ["system", t("theme.system")],
            ]}
            onChange={(siteTheme) => void update({ siteTheme })}
          />
        </Row>
      </Group>
      <Group id="appearance-browse" title={t("settings.browsing")}>
        <Row label={t("settings.worksView")}>
          <Segmented
            label={t("settings.worksView")}
            value={prefs?.worksView}
            options={[
              ["grid", t("home.gridView")],
              ["list", t("home.listView")],
            ]}
            onChange={(worksView) => void update({ worksView })}
          />
        </Row>
        <Row label={t("settings.directoryOrder")}>
          <Segmented
            label={t("settings.directoryOrder")}
            value={prefs?.directoryOrder}
            options={[
              ["oldest", t("work.sortOldest")],
              ["newest", t("work.sortNewest")],
            ]}
            onChange={(directoryOrder) => void update({ directoryOrder })}
          />
        </Row>
      </Group>
      <Status message={message} />
    </div>
  );
}
