/** Reader and site display preferences, stored per device and synchronized for signed-in readers. */
export const READER_PREFS_KEY = "xuye:reader";
export const READER_THEMES = ["sepia", "white", "dark"] as const;
export type ReaderTheme = (typeof READER_THEMES)[number];
export const READER_FONTS = ["serif", "sans"] as const;
export type ReaderFont = (typeof READER_FONTS)[number];
export const SITE_PALETTES = ["a1", "a2", "a3"] as const;
export type SitePalette = (typeof SITE_PALETTES)[number];
export const READING_MODES = ["paged", "continuous"] as const;
export type ReadingMode = (typeof READING_MODES)[number];
export const SITE_THEMES = ["light", "dark", "system"] as const;
export type SiteTheme = (typeof SITE_THEMES)[number];
export const WORKS_VIEWS = ["grid", "list"] as const;
export type WorksView = (typeof WORKS_VIEWS)[number];
export const DIRECTORY_ORDERS = ["oldest", "newest"] as const;
export type DirectoryOrder = (typeof DIRECTORY_ORDERS)[number];
export const READER_SIZE = { min: 15, max: 26, default: 19 } as const;
export const READER_LINE_HEIGHT = { min: 150, max: 260, default: 205 } as const;
export const READER_PAGE_WIDTH = { min: 560, max: 920, default: 720 } as const;

export type ReaderPrefs = {
  theme: ReaderTheme;
  size: number;
  font: ReaderFont;
  palette: SitePalette;
  lineHeight: number;
  pageWidth: number;
  /** null until the reader picks paged or continuous reading (asked on first entering the reader). */
  readingMode: ReadingMode | null;
  siteTheme: SiteTheme;
  worksView: WorksView;
  directoryOrder: DirectoryOrder;
};

const oneOf = <T extends string, F extends T | null>(
  value: unknown,
  options: readonly T[],
  fallback: F,
): T | F => (options.includes(value as T) ? (value as T) : fallback);

const clamp = (value: unknown, range: { min: number; max: number; default: number }) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(range.max, Math.max(range.min, Math.round(value)))
    : range.default;

export function normalizePrefs(value: unknown): ReaderPrefs {
  const raw = (value ?? {}) as Record<string, unknown>;
  return {
    theme: oneOf(raw.theme, READER_THEMES, "sepia"),
    size: clamp(raw.size, READER_SIZE),
    font: oneOf(raw.font, READER_FONTS, "serif"),
    palette: oneOf(raw.palette, SITE_PALETTES, raw.palette === "alt" ? "a2" : "a3"),
    lineHeight: clamp(raw.lineHeight, READER_LINE_HEIGHT),
    pageWidth: clamp(raw.pageWidth, READER_PAGE_WIDTH),
    // Earlier builds stored a boolean autoNext; only an explicit opt-out maps to a choice.
    readingMode: oneOf(raw.readingMode, READING_MODES, raw.autoNext === false ? "paged" : null),
    siteTheme: oneOf(raw.siteTheme, SITE_THEMES, "system"),
    worksView: oneOf(raw.worksView, WORKS_VIEWS, "grid"),
    directoryOrder: oneOf(raw.directoryOrder, DIRECTORY_ORDERS, "oldest"),
  };
}

export function loadPrefs(): ReaderPrefs {
  try {
    return normalizePrefs(JSON.parse(localStorage.getItem(READER_PREFS_KEY) ?? "{}"));
  } catch {
    return normalizePrefs(null);
  }
}

export function applyPrefs(prefs: ReaderPrefs) {
  const root = document.documentElement;
  root.dataset.readerTheme = prefs.theme;
  root.dataset.readerFont = prefs.font;
  root.dataset.palette = prefs.palette;
  root.dataset.siteTheme = prefs.siteTheme;
  root.style.setProperty("--reader-size", `${prefs.size}px`);
  root.style.setProperty("--reader-line-height", String(prefs.lineHeight / 100));
  root.style.setProperty("--reader-width", `${prefs.pageWidth}px`);
}

/** Fired on window with the full ReaderPrefs after any local preference change. */
export const PREFS_EVENT = "xuye:prefs";

/** Stores, applies, and announces a local preference change. Returns the new prefs. */
export function setLocalPrefs(patch: Partial<ReaderPrefs>): ReaderPrefs {
  const next = normalizePrefs({ ...loadPrefs(), ...patch });
  try {
    localStorage.setItem(READER_PREFS_KEY, JSON.stringify(next));
  } catch {
    // storage unavailable: the change lasts for this page only
  }
  applyPrefs(next);
  window.dispatchEvent(new CustomEvent(PREFS_EVENT, { detail: next }));
  return next;
}

/** Server preference fields (user_preferences) for a local change. */
export function serverPatch(patch: Partial<ReaderPrefs>) {
  const map: Record<keyof ReaderPrefs, string> = {
    theme: "readerTheme",
    size: "readerFontSize",
    font: "readerFont",
    palette: "sitePalette",
    lineHeight: "lineHeight",
    pageWidth: "pageWidth",
    readingMode: "readingMode",
    siteTheme: "siteTheme",
    worksView: "worksView",
    directoryOrder: "directoryOrder",
  };
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined && value !== null) out[map[key as keyof ReaderPrefs]] = value;
  }
  return out;
}

/** Set by AccountPreferenceSync, which only mounts for signed-in readers. */
let accountSyncEnabled = false;
export function enableAccountSync() {
  accountSyncEnabled = true;
}

/** Stores a change on this device and, when a reader is signed in, in their account. */
export function savePrefs(patch: Partial<ReaderPrefs>) {
  setLocalPrefs(patch);
  if (accountSyncEnabled) void syncPrefs(patch);
}

/** PUTs a local change for a signed-in reader; resolves to whether the server accepted it. */
export async function syncPrefs(patch: Partial<ReaderPrefs>) {
  const body = serverPatch(patch);
  if (Object.keys(body).length === 0) return true;
  try {
    const response = await fetch("/api/v1/me/preferences", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/** Static pre-paint script for the reader. Keep it in sync with normalizePrefs/applyPrefs. */
export const PREFS_BOOT_SCRIPT = `(function(){try{var p=JSON.parse(localStorage.getItem(${JSON.stringify(
  READER_PREFS_KEY,
)})||"{}");var t=["sepia","white","dark"].indexOf(p.theme)>=0?p.theme:"sepia";var s=typeof p.size==="number"?Math.min(${READER_SIZE.max},Math.max(${READER_SIZE.min},Math.round(p.size))):${READER_SIZE.default};var f=["serif","sans"].indexOf(p.font)>=0?p.font:"serif";var a=["a1","a2","a3"].indexOf(p.palette)>=0?p.palette:p.palette==="alt"?"a2":"a3";var l=typeof p.lineHeight==="number"?Math.min(${READER_LINE_HEIGHT.max},Math.max(${READER_LINE_HEIGHT.min},Math.round(p.lineHeight))):${READER_LINE_HEIGHT.default};var w=typeof p.pageWidth==="number"?Math.min(${READER_PAGE_WIDTH.max},Math.max(${READER_PAGE_WIDTH.min},Math.round(p.pageWidth))):${READER_PAGE_WIDTH.default};var r=document.documentElement;r.dataset.readerTheme=t;r.dataset.readerFont=f;r.dataset.palette=a;r.style.setProperty("--reader-size",s+"px");r.style.setProperty("--reader-line-height",l/100);r.style.setProperty("--reader-width",w+"px");}catch(e){}})();`;

/** Static pre-paint script for every page: site palette and light/dark/system theme. */
export const SITE_BOOT_SCRIPT = `(function(){try{var p=JSON.parse(localStorage.getItem(${JSON.stringify(
  READER_PREFS_KEY,
)})||"{}");var r=document.documentElement;r.dataset.palette=["a1","a2","a3"].indexOf(p.palette)>=0?p.palette:p.palette==="alt"?"a2":"a3";r.dataset.siteTheme=["light","dark","system"].indexOf(p.siteTheme)>=0?p.siteTheme:"system";}catch(e){}})();`;
