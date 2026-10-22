import { describe, expect, it } from "vitest";
import { matchesSelectSearch, nextEnabledIndex } from "./select";

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

  it("skips options hidden by search", () => {
    expect(nextEnabledIndex([
      { disabled: false },
      { disabled: false, hidden: true },
      { disabled: false },
    ], 0, 1)).toBe(2);
  });
});

describe("matchesSelectSearch", () => {
  const option = { label: "Little Legend", value: "little-legend" };

  it("searches labels by default without case sensitivity", () => {
    expect(matchesSelectSearch("legend", option)).toBe(true);
    expect(matchesSelectSearch("little legend", option)).toBe(true);
    expect(matchesSelectSearch("MISSING", option)).toBe(false);
  });

  it("can search option values", () => {
    expect(matchesSelectSearch("little-", option, "value")).toBe(true);
    expect(matchesSelectSearch("special", option, "value")).toBe(false);
  });
});
