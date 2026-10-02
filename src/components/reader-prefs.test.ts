import { describe, expect, it } from "vitest";
import { normalizePrefs, PREFS_BOOT_SCRIPT, READER_PREFS_KEY } from "./reader-prefs";

describe("normalizePrefs", () => {
  it("falls back to defaults for missing or invalid values", () => {
    expect(normalizePrefs(null)).toEqual({
      theme: "sepia",
      size: 19,
      font: "serif",
      palette: "a3",
      lineHeight: 205,
      pageWidth: 720,
      autoNext: true,
    });
    expect(normalizePrefs({ theme: "neon", size: "big", autoNext: "no" })).toEqual({
      theme: "sepia",
      size: 19,
      font: "serif",
      palette: "a3",
      lineHeight: 205,
      pageWidth: 720,
      autoNext: true,
    });
  });

  it("keeps auto-loading off only when explicitly disabled", () => {
    expect(normalizePrefs({ autoNext: false }).autoNext).toBe(false);
    expect(normalizePrefs({ autoNext: true }).autoNext).toBe(true);
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
