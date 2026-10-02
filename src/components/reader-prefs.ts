/** Reader display preferences, stored per device and synchronized for signed-in readers. */
export const READER_PREFS_KEY = "xuye:reader";
export const READER_THEMES = ["sepia", "white", "dark"] as const;
export type ReaderTheme = (typeof READER_THEMES)[number];
export const READER_FONTS = ["serif", "sans"] as const;
export type ReaderFont = (typeof READER_FONTS)[number];
export const SITE_PALETTES = ["a1", "a2", "a3"] as const;
export type SitePalette = (typeof SITE_PALETTES)[number];
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
  /** Append the next chapter when the reader reaches the end of the current one. */
  autoNext: boolean;
};

export function normalizePrefs(value: unknown): ReaderPrefs {
  const raw = (value ?? {}) as Partial<ReaderPrefs>;
  const theme = READER_THEMES.includes(raw.theme as ReaderTheme)
    ? (raw.theme as ReaderTheme)
    : "sepia";
  const size =
    typeof raw.size === "number" && Number.isFinite(raw.size)
      ? Math.min(READER_SIZE.max, Math.max(READER_SIZE.min, Math.round(raw.size)))
      : READER_SIZE.default;
  const font = READER_FONTS.includes(raw.font as ReaderFont) ? (raw.font as ReaderFont) : "serif";
  const palette = SITE_PALETTES.includes(raw.palette as SitePalette)
    ? (raw.palette as SitePalette)
    : raw.palette === ("alt" as SitePalette)
      ? "a2"
      : "a3";
  const lineHeight =
    typeof raw.lineHeight === "number" && Number.isFinite(raw.lineHeight)
      ? Math.min(
          READER_LINE_HEIGHT.max,
          Math.max(READER_LINE_HEIGHT.min, Math.round(raw.lineHeight)),
        )
      : READER_LINE_HEIGHT.default;
  const pageWidth =
    typeof raw.pageWidth === "number" && Number.isFinite(raw.pageWidth)
      ? Math.min(READER_PAGE_WIDTH.max, Math.max(READER_PAGE_WIDTH.min, Math.round(raw.pageWidth)))
      : READER_PAGE_WIDTH.default;
  const autoNext = raw.autoNext !== false;
  return { theme, size, font, palette, lineHeight, pageWidth, autoNext };
}

export function applyPrefs(prefs: ReaderPrefs) {
  const root = document.documentElement;
  root.dataset.readerTheme = prefs.theme;
  root.dataset.readerFont = prefs.font;
  root.dataset.palette = prefs.palette;
  root.style.setProperty("--reader-size", `${prefs.size}px`);
  root.style.setProperty("--reader-line-height", String(prefs.lineHeight / 100));
  root.style.setProperty("--reader-width", `${prefs.pageWidth}px`);
}

/** Fired on window after the site palette changes, so open pickers stay in sync. */
export const PALETTE_EVENT = "xuye:palette";

/** Stores and applies a site palette locally; signed-in callers also PUT it to the server. */
export function setLocalPalette(palette: SitePalette): ReaderPrefs {
  let current: unknown = null;
  try {
    current = JSON.parse(localStorage.getItem(READER_PREFS_KEY) ?? "{}");
  } catch {}
  const next = normalizePrefs({ ...(current as object), palette });
  try {
    localStorage.setItem(READER_PREFS_KEY, JSON.stringify(next));
  } catch {
    // storage unavailable: the palette lasts for this page only
  }
  document.documentElement.dataset.palette = next.palette;
  window.dispatchEvent(new CustomEvent(PALETTE_EVENT, { detail: next.palette }));
  return next;
}

/** Static pre-paint script. Keep it in sync with normalizePrefs/applyPrefs. */
export const PREFS_BOOT_SCRIPT = `(function(){try{var p=JSON.parse(localStorage.getItem(${JSON.stringify(
  READER_PREFS_KEY,
)})||"{}");var t=["sepia","white","dark"].indexOf(p.theme)>=0?p.theme:"sepia";var s=typeof p.size==="number"?Math.min(${READER_SIZE.max},Math.max(${READER_SIZE.min},Math.round(p.size))):${READER_SIZE.default};var f=["serif","sans"].indexOf(p.font)>=0?p.font:"serif";var a=["a1","a2","a3"].indexOf(p.palette)>=0?p.palette:p.palette==="alt"?"a2":"a3";var l=typeof p.lineHeight==="number"?Math.min(${READER_LINE_HEIGHT.max},Math.max(${READER_LINE_HEIGHT.min},Math.round(p.lineHeight))):${READER_LINE_HEIGHT.default};var w=typeof p.pageWidth==="number"?Math.min(${READER_PAGE_WIDTH.max},Math.max(${READER_PAGE_WIDTH.min},Math.round(p.pageWidth))):${READER_PAGE_WIDTH.default};var r=document.documentElement;r.dataset.readerTheme=t;r.dataset.readerFont=f;r.dataset.palette=a;r.style.setProperty("--reader-size",s+"px");r.style.setProperty("--reader-line-height",l/100);r.style.setProperty("--reader-width",w+"px");}catch(e){}})();`;

export const PALETTE_BOOT_SCRIPT = `(function(){try{var p=JSON.parse(localStorage.getItem(${JSON.stringify(
  READER_PREFS_KEY,
)})||"{}");var a=["a1","a2","a3"].indexOf(p.palette)>=0?p.palette:p.palette==="alt"?"a2":"a3";document.documentElement.dataset.palette=a;}catch(e){}})();`;
