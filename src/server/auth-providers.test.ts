import { describe, expect, it } from "vitest";
import { parseServerEnv } from "@/env";
import { configuredProviders } from "./auth-providers";

const base = {
  DATABASE_URL: "postgres://xuye:xuye@localhost:5432/xuye",
  AUTH_SECRET: "x".repeat(32),
};

const ids = (env: Record<string, string>) =>
  configuredProviders(parseServerEnv({ ...base, ...env })).map((p) =>
    typeof p === "function" ? p().id : p.id,
  );

describe("configuredProviders", () => {
  it("enables nothing without credentials", () => {
    expect(ids({})).toEqual([]);
  });

  it("enables each provider only when its credentials are set", () => {
    expect(
      ids({
        EMAIL_SERVER: "smtp://localhost:1025",
        EMAIL_FROM: "續頁 <no-reply@xuye.test>",
        AUTH_GOOGLE_ID: "g",
        AUTH_GOOGLE_SECRET: "g",
      }),
    ).toEqual(["nodemailer", "google"]);
    expect(ids({ AUTH_APPLE_ID: "a", AUTH_APPLE_SECRET: "a" })).toEqual(["apple"]);
  });
});
