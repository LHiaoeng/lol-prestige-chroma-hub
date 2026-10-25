export const TFT_COSMETIC_TIER_ORDER = [
  "kPrestige",
  "kMythic",
  "kLegendary",
  "kStandard",
] as const;

export type TftCosmeticTier = (typeof TFT_COSMETIC_TIER_ORDER)[number];

export function isTftCosmeticTier(value: string): value is TftCosmeticTier {
  return (TFT_COSMETIC_TIER_ORDER as readonly string[]).includes(value);
}
