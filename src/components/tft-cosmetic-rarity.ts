import { communityDragonAssetUrl } from "../domain/communitydragon-url";
import type { CommunityDragonLocale, RuntimeChannel } from "../domain/communitydragon-runtime";
import type { TftArenaRarity } from "../domain/tft-arenas";
import type { TftCompanionRarity } from "../domain/little-legends";

type TftCosmeticRarity = TftArenaRarity | TftCompanionRarity;

const rarityLabels: Record<CommunityDragonLocale, Record<TftCosmeticRarity, string>> = {
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

const rarityIconPaths: Record<TftCosmeticRarity, string> = {
  kStandard: "game/assets/ux/tft/outofgame/raritygems/tft_standardgem_top.png",
  kLegendary: "game/assets/ux/tft/outofgame/raritygems/tft_legendarygem_top.png",
  kMythic: "game/assets/ux/tft/outofgame/raritygems/tft_mythicgem_top.png",
  kPrestige: "game/assets/ux/tft/outofgame/raritygems/tft_prestigegem_top.png",
};

export function tftCosmeticRarityLabel(
  rarity: TftCosmeticRarity,
  locale: CommunityDragonLocale,
): string {
  return rarityLabels[locale][rarity];
}

export function tftCosmeticRarityIconUrl(
  rarity: TftCosmeticRarity,
  channel: RuntimeChannel,
): string {
  return communityDragonAssetUrl(rarityIconPaths[rarity], channel);
}
