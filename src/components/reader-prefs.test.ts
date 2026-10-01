import { describe, expect, it } from "vitest";
import { normalizePrefs, PREFS_BOOT_SCRIPT, READER_PREFS_KEY } from "./reader-prefs";

describe("normalizePrefs", () => {
  it("falls back to defaults for missing or invalid values", () => {
    expect(normalizePrefs(null)).toEqual({ theme: "sepia", size: 19 });
    expect(normalizePrefs({ theme: "neon", size: "big" })).toEqual({ theme: "sepia", size: 19 });
  });

  it("clamps and rounds the font size", () => {
    expect(normalizePrefs({ theme: "dark", size: 99 })).toEqual({ theme: "dark", size: 26 });
    expect(normalizePrefs({ theme: "white", size: 3 })).toEqual({ theme: "white", size: 15 });
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
    return { theme: root.dataset.readerTheme, size: root.style.get("--reader-size") };
  }

  it.each([
    [null],
    ['{"theme":"dark","size":24}'],
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
      expect(result).toEqual({ theme: undefined, size: undefined });
    } else {
      expect(result).toEqual({ theme: expected.theme, size: `${expected.size}px` });
    }
  });
});
