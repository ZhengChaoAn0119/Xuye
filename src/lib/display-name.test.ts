import { describe, expect, it } from "vitest";
import { canChangeDisplayName, cleanDisplayName, displayNameFor } from "./display-name";

describe("display names", () => {
  it("are a paid-member feature; Free members cannot change them", () => {
    expect(canChangeDisplayName("free")).toBe(false);
  });

  it("fall back to a shortened email local part instead of the full address", () => {
    expect(displayNameFor({ name: null, email: "ai6ru6boy@gmail.com" })).toBe("ai6r…");
    expect(displayNameFor({ name: "", email: "amy@x.test" })).toBe("amy");
    expect(displayNameFor({ name: null, email: null })).toBe("讀者");
    expect(displayNameFor({ name: " 書蟲 ", email: "a@b.test" })).toBe("書蟲");
  });

  it("clean submitted names and enforce 2–20 characters", () => {
    expect(cleanDisplayName("  夜讀   書蟲 ")).toBe("夜讀 書蟲");
    expect(cleanDisplayName("a\u0000b​")).toBe("ab");
    expect(cleanDisplayName("字")).toBeNull();
    expect(cleanDisplayName("字".repeat(21))).toBeNull();
  });
});
