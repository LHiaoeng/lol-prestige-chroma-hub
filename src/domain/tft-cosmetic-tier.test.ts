import { describe, expect, it } from "vitest";
import { TFT_COSMETIC_TIER_ORDER, isTftCosmeticTier } from "./tft-cosmetic-tier";

describe("TFT cosmetic tier", () => {
  it("recognizes the four shared tiers and rejects unknown values", () => {
    expect(TFT_COSMETIC_TIER_ORDER).toEqual([
      "kPrestige", "kMythic", "kLegendary", "kStandard",
    ]);
    expect(TFT_COSMETIC_TIER_ORDER.every(isTftCosmeticTier)).toBe(true);
    expect(isTftCosmeticTier("kUnlisted")).toBe(false);
  });
});
