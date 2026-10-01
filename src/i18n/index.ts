import zhHant from "./messages/zh-Hant";

/** Locales with complete translations. Planned: "zh-Hans", "en", "ja" (no URL prefix yet). */
export const locales = ["zh-Hant"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "zh-Hant";

type DeepString<T> = { [K in keyof T]: T[K] extends string ? string : DeepString<T[K]> };
/** Shape every locale's messages must match; new locale files are typed against this. */
export type Messages = DeepString<typeof zhHant>;

const catalogs: Record<Locale, Messages> = { "zh-Hant": zhHant };

type Join<K, P> = K extends string ? (P extends string ? `${K}.${P}` : never) : never;
type Paths<T> = {
  [K in keyof T & string]: T[K] extends string ? K : Join<K, Paths<T[K]>>;
}[keyof T & string];
export type MessageKey = Paths<Messages>;

/** Look up a UI string by dotted key, e.g. t("nav.latest"). */
export function t(key: MessageKey, locale: Locale = defaultLocale): string {
  let node: unknown = catalogs[locale];
  for (const part of key.split(".")) {
    node = (node as Record<string, unknown>)[part];
  }
  if (typeof node !== "string") throw new Error(`Missing message: ${key} (${locale})`);
  return node;
}
