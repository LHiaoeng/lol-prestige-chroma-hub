import { communityDragonAssetUrl } from "../domain/communitydragon-url";
import type { CommunityDragonLocale, RuntimeChannel } from "../domain/communitydragon-runtime";
import type { TftCosmeticTier } from "../domain/tft-cosmetic-tier";

const rarityLabels: Record<CommunityDragonLocale, Record<TftCosmeticTier, string>> = {
  zh_cn: {
    kStandard: "经典",
    kLegendary: "传说",
    kMythic: "神话",
    kPrestige: "至臻",
  },
  default: {
    kStandard: "Standard",
    kLegendary: "Legendary",
    kMythic: "Mythic",
    kPrestige: "Prestige",
  },
};

const rarityIconPaths: Record<TftCosmeticTier, string> = {
  kStandard: "game/assets/ux/tft/outofgame/raritygems/tft_standardgem_top.png",
  kLegendary: "game/assets/ux/tft/outofgame/raritygems/tft_legendarygem_top.png",
  kMythic: "game/assets/ux/tft/outofgame/raritygems/tft_mythicgem_top.png",
  kPrestige: "game/assets/ux/tft/outofgame/raritygems/tft_prestigegem_top.png",
};

export function tftCosmeticTierLabel(
  rarity: TftCosmeticTier,
  locale: CommunityDragonLocale,
): string {
  return rarityLabels[locale][rarity];
}

export function tftCosmeticTierIconUrl(
  rarity: TftCosmeticTier,
  channel: RuntimeChannel,
): string {
  return communityDragonAssetUrl(rarityIconPaths[rarity], channel);
}
