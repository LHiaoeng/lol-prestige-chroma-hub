import { describe, expect, it } from "vitest";
import { TFT_COMPANION_RARITY_ORDER } from "../domain/little-legends";
import { TFT_ARENA_RARITY_ORDER } from "../domain/tft-arenas";
import {
  tftCosmeticRarityIconUrl,
  tftCosmeticRarityLabel,
} from "./tft-cosmetic-rarity";

describe("TFT cosmetic rarity", () => {
  it("shares localized rarity labels across companion and arena data", () => {
    const labels = ["至臻", "神话", "传说", "经典"];
    expect(TFT_COMPANION_RARITY_ORDER.map((rarity) =>
      tftCosmeticRarityLabel(rarity, "zh_cn"),
    )).toEqual(labels);
    expect(TFT_ARENA_RARITY_ORDER.map((rarity) =>
      tftCosmeticRarityLabel(rarity, "zh_cn"),
    )).toEqual(labels);
    expect(TFT_COMPANION_RARITY_ORDER.map((rarity) =>
      tftCosmeticRarityLabel(rarity, "default"),
    )).toEqual(["Prestige", "Mythic", "Legendary", "Standard"]);
  });

  it("uses the documented gem asset for each rarity and channel", () => {
    expect(tftCosmeticRarityIconUrl("kStandard", "pbe")).toBe(
      "https://raw.communitydragon.org/pbe/game/assets/ux/tft/outofgame/raritygems/tft_standardgem_top.png",
    );
    expect(tftCosmeticRarityIconUrl("kLegendary", "latest")).toBe(
      "https://raw.communitydragon.org/latest/game/assets/ux/tft/outofgame/raritygems/tft_legendarygem_top.png",
    );
    expect(tftCosmeticRarityIconUrl("kMythic", "latest")).toBe(
      "https://raw.communitydragon.org/latest/game/assets/ux/tft/outofgame/raritygems/tft_mythicgem_top.png",
    );
    expect(tftCosmeticRarityIconUrl("kPrestige", "pbe")).toBe(
      "https://raw.communitydragon.org/pbe/game/assets/ux/tft/outofgame/raritygems/tft_prestigegem_top.png",
    );
  });
});
