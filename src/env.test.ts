import { describe, expect, it } from "vitest";
import { parseServerEnv } from "./env";

const base = {
  DATABASE_URL: "postgres://xuye:xuye@localhost:5432/xuye",
  AUTH_SECRET: "x".repeat(32),
};

describe("parseServerEnv", () => {
  it("accepts the minimal configuration", () => {
    const env = parseServerEnv(base);
    expect(env.NODE_ENV).toBe("development");
    expect(env.AUTH_GOOGLE_ID).toBeUndefined();
  });

  it("treats empty strings as unset", () => {
    const env = parseServerEnv({ ...base, AUTH_GOOGLE_ID: "", AUTH_GOOGLE_SECRET: "" });
    expect(env.AUTH_GOOGLE_ID).toBeUndefined();
  });

  it("rejects a non-postgres database URL", () => {
    expect(() => parseServerEnv({ ...base, DATABASE_URL: "mysql://localhost/x" })).toThrow(
      /DATABASE_URL/,
    );
  });

  it("rejects a short AUTH_SECRET", () => {
    expect(() => parseServerEnv({ ...base, AUTH_SECRET: "short" })).toThrow(/AUTH_SECRET/);
  });

  it("requires provider credentials in pairs", () => {
    expect(() => parseServerEnv({ ...base, AUTH_GOOGLE_ID: "id" })).toThrow(/AUTH_GOOGLE_SECRET/);
    expect(() => parseServerEnv({ ...base, EMAIL_FROM: "a@b.c" })).toThrow(/EMAIL_SERVER/);
  });
});
