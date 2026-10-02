import { describe, expect, it } from "vitest";
import {
  createVisitorToken,
  privateHash,
  readVisitorToken,
  visitorSecret,
} from "./visitor-identity";

const secret = "a".repeat(32);

describe("visitor identity", () => {
  it("round-trips signed identifiers and rejects tampering", () => {
    const token = createVisitorToken(secret, "00000000-0000-4000-8000-000000000001");
    expect(readVisitorToken(token, secret)).toBe("00000000-0000-4000-8000-000000000001");
    expect(readVisitorToken(`${token}x`, secret)).toBeNull();
    expect(readVisitorToken(undefined, secret)).toBeNull();
  });

  it("uses purpose-separated irreversible hashes", () => {
    expect(privateHash("same", secret, "ip")).not.toBe(privateHash("same", secret, "trait"));
    expect(privateHash("same", secret, "ip")).toBe(privateHash("same", secret, "ip"));
  });

  it("allows a dedicated production secret with an auth-secret fallback", () => {
    expect(visitorSecret({ AUTH_SECRET: secret })).toBe(secret);
    expect(visitorSecret({ AUTH_SECRET: secret, VISITOR_ID_SECRET: "b".repeat(32) })).toBe(
      "b".repeat(32),
    );
  });
});
