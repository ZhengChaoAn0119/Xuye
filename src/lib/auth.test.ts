import { describe, expect, it } from "vitest";
import { safeCallbackUrl } from "./auth";

describe("safeCallbackUrl", () => {
  it("accepts same-origin relative paths", () => {
    expect(safeCallbackUrl("/library")).toBe("/library");
    expect(safeCallbackUrl("/works/1?from=signin")).toBe("/works/1?from=signin");
  });

  it("rejects absolute and protocol-relative redirects", () => {
    expect(safeCallbackUrl("https://example.com")).toBe("/");
    expect(safeCallbackUrl("//example.com")).toBe("/");
    expect(safeCallbackUrl(null)).toBe("/");
  });
});
