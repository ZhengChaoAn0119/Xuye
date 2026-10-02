import { describe, expect, it } from "vitest";
import { DEFAULT_QUOTAS, quotaSnapshot, RATE_LIMIT } from "./quota";

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
