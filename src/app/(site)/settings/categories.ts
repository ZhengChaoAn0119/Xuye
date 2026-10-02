import type { MessageKey } from "@/i18n";

/** Settings sections, in navigation order. Account-only sections need a signed-in reader. */
export const SETTINGS_CATEGORIES = [
  {
    href: "/settings/profile",
    label: "settings.profile",
    hint: "settings.profileHint",
    accountOnly: true,
  },
  {
    href: "/settings/reading",
    label: "settings.reading",
    hint: "settings.readingHint",
    accountOnly: false,
  },
  {
    href: "/settings/appearance",
    label: "settings.appearance",
    hint: "settings.appearanceHint",
    accountOnly: false,
  },
  {
    href: "/settings/content",
    label: "settings.content",
    hint: "settings.contentHint",
    accountOnly: true,
  },
  {
    href: "/settings/privacy",
    label: "settings.privacy",
    hint: "settings.privacyHint",
    accountOnly: true,
  },
] as const satisfies readonly {
  href: `/settings/${string}`;
  label: MessageKey;
  hint: MessageKey;
  accountOnly: boolean;
}[];
