import { describe, expect, it } from "vitest";
import {
  DEFAULT_QUOTAS,
  DEFAULT_REREAD_GRACE_MINUTES,
  quotaSnapshot,
  RATE_LIMIT,
  withinRereadGrace,
} from "./quota";

describe("withinRereadGrace", () => {
  const charged = new Date("2026-10-02T12:00:00Z");
  const after = (minutes: number) => new Date(charged.getTime() + minutes * 60_000);

  it("defaults to a 10 minute grace", () => {
    expect(DEFAULT_REREAD_GRACE_MINUTES).toBe(10);
  });

  it("does not charge a repeat within the grace after the last charge", () => {
    expect(withinRereadGrace(charged, after(0), 10)).toBe(true);
    expect(withinRereadGrace(charged, after(9.9), 10)).toBe(true);
  });

  it("charges again once the grace has passed", () => {
    expect(withinRereadGrace(charged, after(10), 10)).toBe(false);
    expect(withinRereadGrace(charged, after(600), 10)).toBe(false);
  });

  it("charges a chapter that was never charged, or when the grace is off", () => {
    expect(withinRereadGrace(null, after(1), 10)).toBe(false);
    expect(withinRereadGrace(charged, after(1), 0)).toBe(false);
  });

  it("ignores clock skew that would put the charge in the future", () => {
    expect(withinRereadGrace(charged, after(-1), 10)).toBe(false);
  });
});

describe("quota policy", () => {
  it("uses the confirmed visitor and Free rolling-window defaults", () => {
    expect(DEFAULT_QUOTAS).toEqual({ visitor: 10, free: 50 });
  });

  it("never reports a negative remaining count", () => {
    expect(quotaSnapshot("visitor", 10, 3, null)).toMatchObject({ remaining: 7, used: 3 });
    expect(quotaSnapshot("free", 50, 55, null)).toMatchObject({ remaining: 0, used: 55 });
  });

  it("keeps the shared-IP ceiling wider than the per-reader ceiling", () => {
    expect(RATE_LIMIT.ipRequests).toBeGreaterThan(RATE_LIMIT.subjectRequests);
  });
});
