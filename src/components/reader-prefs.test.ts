import { describe, expect, it } from "vitest";
import {
  normalizePrefs,
  PREFS_BOOT_SCRIPT,
  READER_PREFS_KEY,
  serverPatch,
  SITE_BOOT_SCRIPT,
} from "./reader-prefs";

describe("SITE_BOOT_SCRIPT", () => {
  function boot(stored: string | null) {
    const dataset: Record<string, string> = {};
    new Function("localStorage", "document", SITE_BOOT_SCRIPT)(
      { getItem: (k: string) => (k === READER_PREFS_KEY ? stored : null) },
      { documentElement: { dataset } },
    );
    return dataset;
  }

  it.each([[null], ['{"siteTheme":"dark","palette":"a1"}'], ['{"siteTheme":"neon"}']])(
    "matches normalizePrefs for %s",
    (stored) => {
      const expected = normalizePrefs(JSON.parse(stored ?? "{}"));
      expect(boot(stored)).toEqual({ palette: expected.palette, siteTheme: expected.siteTheme });
    },
  );
});

describe("serverPatch", () => {
  it("maps device preference names to account fields and skips unchosen values", () => {
    expect(serverPatch({ theme: "dark", size: 20, readingMode: null, siteTheme: "light" })).toEqual(
      { readerTheme: "dark", readerFontSize: 20, siteTheme: "light" },
    );
  });
});

describe("normalizePrefs", () => {
  it("falls back to defaults for missing or invalid values", () => {
    expect(normalizePrefs(null)).toEqual({
      theme: "sepia",
      size: 19,
      font: "serif",
      palette: "a3",
      lineHeight: 205,
      pageWidth: 720,
      readingMode: null,
      siteTheme: "system",
      worksView: "grid",
      directoryOrder: "oldest",
    });
    expect(
      normalizePrefs({ theme: "neon", size: "big", readingMode: "scroll", siteTheme: "neon" }),
    ).toEqual(normalizePrefs(null));
  });

  it("leaves the reading mode unchosen until the reader picks one", () => {
    expect(normalizePrefs({ readingMode: "continuous" }).readingMode).toBe("continuous");
    expect(normalizePrefs({ readingMode: "paged" }).readingMode).toBe("paged");
    // Older builds stored autoNext; only an explicit opt-out counts as choosing paged reading.
    expect(normalizePrefs({ autoNext: false }).readingMode).toBe("paged");
    expect(normalizePrefs({ autoNext: true }).readingMode).toBeNull();
  });

  it("clamps and rounds the font size", () => {
    expect(normalizePrefs({ theme: "dark", size: 99 })).toMatchObject({ theme: "dark", size: 26 });
    expect(normalizePrefs({ theme: "white", size: 3 })).toMatchObject({ theme: "white", size: 15 });
    expect(normalizePrefs({ size: 20.6 }).size).toBe(21);
  });
});

describe("PREFS_BOOT_SCRIPT", () => {
  // Runs the inline script against a fake DOM and storage, and checks it agrees with normalizePrefs.
  function boot(stored: string | null) {
    const root = { dataset: {} as Record<string, string>, style: new Map<string, string>() };
    const env = {
      localStorage: { getItem: (k: string) => (k === READER_PREFS_KEY ? stored : null) },
      document: {
        documentElement: {
          dataset: root.dataset,
          style: { setProperty: (k: string, v: string) => root.style.set(k, v) },
        },
      },
    };
    new Function("localStorage", "document", PREFS_BOOT_SCRIPT)(env.localStorage, env.document);
    return {
      theme: root.dataset.readerTheme,
      palette: root.dataset.palette,
      size: root.style.get("--reader-size"),
    };
  }

  it.each([
    [null],
    ['{"theme":"dark","size":24}'],
    ['{"palette":"a1"}'],
    ['{"palette":"alt"}'],
    ['{"theme":"neon","size":99}'],
    ['{"size":3}'],
    ["not json"],
  ])("matches normalizePrefs for %s", (stored) => {
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(stored ?? "{}");
    } catch {
      parsed = null;
    }
    const expected = normalizePrefs(parsed);
    const result = boot(stored);
    if (stored === "not json") {
      // Unparseable storage leaves the page on its CSS defaults.
      expect(result).toEqual({ theme: undefined, palette: undefined, size: undefined });
    } else {
      expect(result).toEqual({
        theme: expected.theme,
        palette: expected.palette,
        size: `${expected.size}px`,
      });
    }
  });
});
