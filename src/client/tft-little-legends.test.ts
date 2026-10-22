import { describe, expect, it } from "vitest";
import {
  tftCompanionRarityIconUrl,
  tftCompanionRarityLabel,
  tftCompanionTypeLabel,
} from "./tft-little-legends";

describe("TFT companion labels", () => {
  it("uses localized names for every verified rarity and companion type", () => {
    expect(tftCompanionRarityLabel("kStandard", "zh_cn")).toBe("经典");
    expect(tftCompanionRarityLabel("kLegendary", "zh_cn")).toBe("传说");
    expect(tftCompanionRarityLabel("kMythic", "zh_cn")).toBe("神话");
    expect(tftCompanionRarityLabel("kPrestige", "zh_cn")).toBe("至臻");
    expect(tftCompanionRarityLabel("kStandard", "default")).toBe(
      "Standard",
    );
    expect(tftCompanionRarityLabel("kLegendary", "default")).toBe(
      "Legendary",
    );
    expect(tftCompanionRarityLabel("kMythic", "default")).toBe("Mythic");
    expect(tftCompanionRarityLabel("kPrestige", "default")).toBe("Prestige");
    expect(tftCompanionTypeLabel("kLittleLegend", "zh_cn")).toBe("小小英雄");
    expect(tftCompanionTypeLabel("kChibi", "zh_cn")).toBe("英雄级小小英雄");
    expect(tftCompanionTypeLabel("kStyle2", "zh_cn")).toBe("不朽弈士形象");
    expect(tftCompanionTypeLabel("kLittleLegend", "default")).toBe("Little Legends");
    expect(tftCompanionTypeLabel("kChibi", "default")).toBe("Chibis");
    expect(tftCompanionTypeLabel("kStyle2", "default")).toBe("Unbound");
  });

  it("uses the documented rarity gem for each rarity and data channel", () => {
    expect(tftCompanionRarityIconUrl("kStandard", "pbe")).toBe(
      "https://raw.communitydragon.org/pbe/game/assets/ux/tft/outofgame/raritygems/tft_standardgem_retier.png",
    );
    expect(tftCompanionRarityIconUrl("kLegendary", "latest")).toBe(
      "https://raw.communitydragon.org/latest/game/assets/ux/tft/outofgame/raritygems/tft_legendarygem_retier.png",
    );
    expect(tftCompanionRarityIconUrl("kMythic", "latest")).toBe(
      "https://raw.communitydragon.org/latest/game/assets/ux/tft/outofgame/raritygems/tft_mythicgem_retier.png",
    );
    expect(tftCompanionRarityIconUrl("kPrestige", "pbe")).toBe(
      "https://raw.communitydragon.org/pbe/game/assets/ux/tft/outofgame/raritygems/tft_prestigegem_retier.png",
    );
  });
});
