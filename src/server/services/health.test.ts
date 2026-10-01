import { describe, expect, it } from "vitest";
import { checkHealth } from "./health";

const now = () => new Date("2026-10-01T00:00:00Z");

describe("checkHealth", () => {
  it("reports ok when the database answers", async () => {
    const report = await checkHealth({ pingDatabase: async () => {}, now });
    expect(report).toEqual({ status: "ok", database: "ok", checkedAt: "2026-10-01T00:00:00.000Z" });
  });

  it("reports degraded instead of throwing when the database is down", async () => {
    const report = await checkHealth({
      pingDatabase: async () => {
        throw new Error("ECONNREFUSED");
      },
      now,
    });
    expect(report.status).toBe("degraded");
    expect(report.database).toBe("unreachable");
  });
});
