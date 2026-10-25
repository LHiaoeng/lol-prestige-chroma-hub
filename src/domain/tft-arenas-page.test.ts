import { describe, expect, it } from "vitest";
import { arenaPageSize, arenaVisibleCount } from "./tft-arenas-page";

describe("TFT arena batches", () => {
  it("limits each batch to 50 and completes rows", () => {
    expect(arenaPageSize(2)).toBe(50);
    expect(arenaPageSize(3)).toBe(48);
    expect(arenaPageSize(4)).toBe(48);
  });

  it("preserves loaded rows on resize and shows a final partial row", () => {
    expect(arenaVisibleCount(16, 2, 100)).toBe(32);
    expect(arenaVisibleCount(16, 3, 100)).toBe(48);
    expect(arenaVisibleCount(16, 3, 47)).toBe(47);
  });
});
