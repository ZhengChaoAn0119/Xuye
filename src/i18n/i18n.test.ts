import { describe, expect, it } from "vitest";
import { defaultLocale, t, type MessageKey } from ".";

describe("t", () => {
  it("defaults to Traditional Chinese", () => {
    expect(defaultLocale).toBe("zh-Hant");
    expect(t("nav.latest")).toBe("最新");
  });

  it("throws on a key that is not a leaf string", () => {
    expect(() => t("nav" as MessageKey)).toThrow(/Missing message/);
  });
});
