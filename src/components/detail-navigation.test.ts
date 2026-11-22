import { describe, expect, it } from "vitest";
import { adjacentDetailItem } from "./detail-navigation";

describe("detail navigation", () => {
  it("follows the supplied order and wraps both ways", () => {
    const items = ["newest", "middle", "oldest"];
    expect(adjacentDetailItem(items, 0, 1)).toBe("middle");
    expect(adjacentDetailItem(items, 0, -1)).toBe("oldest");
    expect(adjacentDetailItem(items, 2, 1)).toBe("newest");
  });

  it("omits targets for a single item or an unknown current item", () => {
    expect(adjacentDetailItem(["only"], 0, 1)).toBeUndefined();
    expect(adjacentDetailItem(["first", "second"], -1, 1)).toBeUndefined();
  });
});
