import { describe, expect, it } from "vitest";
import { defaultLocale, t, type MessageKey } from ".";

describe("t", () => {
  it("defaults to Traditional Chinese", () => {
    expect(defaultLocale).toBe("zh-Hant");
    expect(t("nav.latest")).toBe("最新");
  });

  it("fills placeholders and groups numbers", () => {
    expect(t("common.chapters", { count: 1234 })).toBe("1,234 章");
    expect(t("search.resultsFor", { query: "東京" })).toBe("「東京」的搜尋結果");
  });

  it("leaves unknown placeholders untouched", () => {
    expect(t("common.chapters", {})).toBe("{count} 章");
  });

  it("throws on a key that is not a leaf string", () => {
    expect(() => t("nav" as MessageKey)).toThrow(/Missing message/);
  });
});
