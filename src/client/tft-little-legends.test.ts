import { describe, expect, it } from "vitest";
import {
  TFT_COMPANION_RARITY_ORDER,
  TFT_COMPANION_TYPE_ORDER,
} from "../domain/little-legends";
import {
  tftCompanionRarityIconUrl,
  tftCompanionRarityLabel,
  tftCompanionDisplayName,
  tftCompanionTypeLabel,
} from "./tft-little-legends";

describe("TFT companion labels", () => {
  it("appends a star suffix only when the companion has multiple star levels", () => {
    const item = { name: "我是啵啵龙 羽饰骑士", level: 3 };
    expect(tftCompanionDisplayName(item, true, "zh_cn")).toBe(
      "我是啵啵龙 羽饰骑士 3星",
    );
    expect(tftCompanionDisplayName(item, false, "zh_cn")).toBe(item.name);
    expect(tftCompanionDisplayName({ name: "Poro", level: 3 }, true, "default")).toBe(
      "Poro 3 stars",
    );
  });

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

  it("orders category and rarity filters from highest to lowest", () => {
    expect(TFT_COMPANION_TYPE_ORDER.map((type) =>
      tftCompanionTypeLabel(type, "zh_cn"),
    )).toEqual(["不朽弈士形象", "英雄级小小英雄", "小小英雄"]);
    expect(TFT_COMPANION_RARITY_ORDER.map((rarity) =>
      tftCompanionRarityLabel(rarity, "zh_cn"),
    )).toEqual(["至臻", "神话", "传说", "经典"]);
  });

  it("uses the documented rarity gem for each rarity and data channel", () => {
    expect(tftCompanionRarityIconUrl("kStandard", "pbe")).toBe(
      "https://raw.communitydragon.org/pbe/game/assets/ux/tft/outofgame/raritygems/tft_standardgem_top.png",
    );
    expect(tftCompanionRarityIconUrl("kLegendary", "latest")).toBe(
      "https://raw.communitydragon.org/latest/game/assets/ux/tft/outofgame/raritygems/tft_legendarygem_top.png",
    );
    expect(tftCompanionRarityIconUrl("kMythic", "latest")).toBe(
      "https://raw.communitydragon.org/latest/game/assets/ux/tft/outofgame/raritygems/tft_mythicgem_top.png",
    );
    expect(tftCompanionRarityIconUrl("kPrestige", "pbe")).toBe(
      "https://raw.communitydragon.org/pbe/game/assets/ux/tft/outofgame/raritygems/tft_prestigegem_top.png",
    );
  });
});
