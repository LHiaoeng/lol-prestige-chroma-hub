import { describe, expect, it } from "vitest";
import { nextEnabledIndex } from "./select";

describe("nextEnabledIndex", () => {
  const options = [{ disabled: false }, { disabled: true }, { disabled: false }];

  it("skips disabled options and wraps around", () => {
    expect(nextEnabledIndex(options, 0, 1)).toBe(2);
    expect(nextEnabledIndex(options, 2, 1)).toBe(0);
    expect(nextEnabledIndex(options, 0, -1)).toBe(2);
  });

  it("returns -1 when there are no enabled options", () => {
    expect(nextEnabledIndex([{ disabled: true }], 0, 1)).toBe(-1);
    expect(nextEnabledIndex([], -1, 1)).toBe(-1);
  });
});
