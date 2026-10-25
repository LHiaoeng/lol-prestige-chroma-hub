import { describe, expect, it } from "vitest";
import { TFT_COSMETIC_TIER_ORDER } from "../domain/tft-cosmetic-tier";
import {
  tftCosmeticTierIconUrl,
  tftCosmeticTierLabel,
} from "./tft-cosmetic-tier";

describe("TFT cosmetic tier", () => {
  it("shares localized rarity labels across companion and arena data", () => {
    const labels = ["至臻", "神话", "传说", "经典"];
    expect(TFT_COSMETIC_TIER_ORDER.map((rarity) =>
      tftCosmeticTierLabel(rarity, "zh_cn"),
    )).toEqual(labels);
    expect(TFT_COSMETIC_TIER_ORDER.map((rarity) =>
      tftCosmeticTierLabel(rarity, "default"),
    )).toEqual(["Prestige", "Mythic", "Legendary", "Standard"]);
  });

  it("uses the documented gem asset for each rarity and channel", () => {
    expect(tftCosmeticTierIconUrl("kStandard", "pbe")).toBe(
      "https://raw.communitydragon.org/pbe/game/assets/ux/tft/outofgame/raritygems/tft_standardgem_top.png",
    );
    expect(tftCosmeticTierIconUrl("kLegendary", "latest")).toBe(
      "https://raw.communitydragon.org/latest/game/assets/ux/tft/outofgame/raritygems/tft_legendarygem_top.png",
    );
    expect(tftCosmeticTierIconUrl("kMythic", "latest")).toBe(
      "https://raw.communitydragon.org/latest/game/assets/ux/tft/outofgame/raritygems/tft_mythicgem_top.png",
    );
    expect(tftCosmeticTierIconUrl("kPrestige", "pbe")).toBe(
      "https://raw.communitydragon.org/pbe/game/assets/ux/tft/outofgame/raritygems/tft_prestigegem_top.png",
    );
  });
});
