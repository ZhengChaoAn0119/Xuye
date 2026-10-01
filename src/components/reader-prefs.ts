/** Reader display preferences, stored per device (account sync arrives in phase 3). */
export const READER_PREFS_KEY = "xuye:reader";
export const READER_THEMES = ["sepia", "white", "dark"] as const;
export type ReaderTheme = (typeof READER_THEMES)[number];
export const READER_SIZE = { min: 15, max: 26, default: 19 } as const;

export type ReaderPrefs = { theme: ReaderTheme; size: number };

export function normalizePrefs(value: unknown): ReaderPrefs {
  const raw = (value ?? {}) as Partial<ReaderPrefs>;
  const theme = READER_THEMES.includes(raw.theme as ReaderTheme)
    ? (raw.theme as ReaderTheme)
    : "sepia";
  const size =
    typeof raw.size === "number" && Number.isFinite(raw.size)
      ? Math.min(READER_SIZE.max, Math.max(READER_SIZE.min, Math.round(raw.size)))
      : READER_SIZE.default;
  return { theme, size };
}

/** Apply prefs to <html> so the reader CSS picks them up without re-rendering. */
export function applyPrefs(prefs: ReaderPrefs) {
  const root = document.documentElement;
  root.dataset.readerTheme = prefs.theme;
  root.style.setProperty("--reader-size", `${prefs.size}px`);
}

/**
 * Inline script run before the reader paints, so saved prefs never flash.
 * Static string; must stay in sync with normalizePrefs/applyPrefs.
 */
export const PREFS_BOOT_SCRIPT = `(function(){try{var p=JSON.parse(localStorage.getItem(${JSON.stringify(
  READER_PREFS_KEY,
)})||"{}");var t=["sepia","white","dark"].indexOf(p.theme)>=0?p.theme:"sepia";var s=typeof p.size==="number"?Math.min(${READER_SIZE.max},Math.max(${READER_SIZE.min},Math.round(p.size))):${READER_SIZE.default};var r=document.documentElement;r.dataset.readerTheme=t;r.style.setProperty("--reader-size",s+"px");}catch(e){}})();`;
