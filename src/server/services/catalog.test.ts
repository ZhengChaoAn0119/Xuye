import { describe, expect, it } from "vitest";
import { escapeLike, neighbors } from "./catalog";

describe("neighbors", () => {
  const positions = [1, 2, 4, 7];

  it("finds the adjacent readable positions", () => {
    expect(neighbors(positions, 2)).toEqual({ prev: 1, next: 4 });
    expect(neighbors(positions, 4)).toEqual({ prev: 2, next: 7 });
  });

  it("skips gaps left by hidden or scheduled chapters", () => {
    expect(neighbors(positions, 3)).toEqual({ prev: 2, next: 4 });
  });

  it("returns null at the ends", () => {
    expect(neighbors(positions, 1)).toEqual({ prev: null, next: 2 });
    expect(neighbors(positions, 7)).toEqual({ prev: 4, next: null });
    expect(neighbors([], 1)).toEqual({ prev: null, next: null });
  });
});

describe("escapeLike", () => {
  it("escapes LIKE wildcards so user input matches literally", () => {
    expect(escapeLike("100%_\\")).toBe("100\\%\\_\\\\");
    expect(escapeLike("東京")).toBe("東京");
  });
});
