import { describe, expect, it } from "vitest";
import {
  ageOnDate,
  contentAllowed,
  libraryState,
  normalizeReaderPreferences,
} from "./reader-account";

describe("normalizeReaderPreferences", () => {
  it("clamps numeric reader settings and rejects unknown options", () => {
    expect(
      normalizeReaderPreferences({
        readerFontSize: 99,
        readerTheme: "unknown" as "dark",
        readerFont: "unknown" as "serif",
        sitePalette: "unknown" as "a3",
        lineHeight: 10,
        pageWidth: 9999,
      }),
    ).toMatchObject({
      readerFontSize: 26,
      readerTheme: "sepia",
      readerFont: "serif",
      sitePalette: "a3",
      lineHeight: 150,
      pageWidth: 920,
    });
  });

  it("keeps sensitive content hidden by default", () => {
    expect(normalizeReaderPreferences({})).toMatchObject({
      showSexual: false,
      showViolence: false,
    });
  });
});

describe("contentAllowed", () => {
  const hidden = { showSexual: false, showViolence: false };
  it("requires each matching preference", () => {
    expect(contentAllowed({ hasSexual: false, hasViolence: false }, hidden)).toBe(true);
    expect(contentAllowed({ hasSexual: true, hasViolence: false }, hidden)).toBe(false);
    expect(
      contentAllowed(
        { hasSexual: true, hasViolence: true },
        { showSexual: true, showViolence: false },
      ),
    ).toBe(false);
  });
});

describe("libraryState", () => {
  it("separates unread, new chapter, and caught-up states", () => {
    expect(libraryState(null, 10)).toBe("unread");
    expect(libraryState(8, 10)).toBe("new");
    expect(libraryState(10, 10)).toBe("done");
  });
});

describe("ageOnDate", () => {
  const today = new Date("2026-10-02T00:00:00.000Z");
  it("handles the birthday boundary", () => {
    expect(ageOnDate("2008-10-02", today)).toBe(18);
    expect(ageOnDate("2008-10-03", today)).toBe(17);
  });
  it("rejects invalid calendar dates", () => {
    expect(ageOnDate("2008-02-30", today)).toBe(-1);
  });
});
