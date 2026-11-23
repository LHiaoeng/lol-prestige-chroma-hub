import { z } from "zod";
import {
  communityDragonAssetUrl,
  type CommunityDragonChannel,
  type CommunityDragonLocalizationView,
} from "./communitydragon-url";
import { TFT_COSMETIC_TIER_ORDER, type TftCosmeticTier } from "./tft-cosmetic-tier";

export type TftCosmeticCatalog = "booms" | "portals";

export interface TftCosmeticFeatureTag {
  readonly featureType: string;
  readonly name: string;
  readonly iconUrl: string;
}

export interface TftCosmetic {
  readonly itemId: number;
  readonly contentId: string;
  readonly isPbeAddition?: boolean;
  readonly name: string;
  readonly TFTRarity: TftCosmeticTier;
  readonly imageUrl: string;
  readonly previewUrl: string;
  readonly featureTags: readonly TftCosmeticFeatureTag[];
  readonly searchAliases?: readonly string[];
}

export interface TftCosmeticFilters {
  readonly search?: string;
  readonly TFTRarity?: TftCosmeticTier;
  readonly featureTypes?: readonly string[];
  readonly onlyPbeAdditions?: boolean;
  readonly sort?: TftCosmeticSort;
}

export const TFT_COSMETIC_SORTS = [
  "default",
  "id_asc",
  "rarity_desc",
  "rarity_asc",
  "name_asc",
  "name_desc",
] as const;

export type TftCosmeticSort = (typeof TFT_COSMETIC_SORTS)[number];

export function isTftCosmeticSort(value: string): value is TftCosmeticSort {
  return (TFT_COSMETIC_SORTS as readonly string[]).includes(value);
}

const positiveSafeInteger = z.number().int().positive().refine(Number.isSafeInteger);
const nonBlankText = z.string().refine((value) => value.trim().length > 0);
const baseItemSchema = z.object({
  itemId: positiveSafeInteger,
  contentId: nonBlankText,
  name: nonBlankText,
  TFTRarity: z.enum(TFT_COSMETIC_TIER_ORDER),
  loadoutsIcon: nonBlankText,
  largeLoadoutsIcon: nonBlankText.optional(),
});

const featureReferenceSchema = z.object({
  featureType: nonBlankText,
});

const contentRecordSchema = z.object({
  id: nonBlankText,
  contentData: z.object({
    featureTags: z.array(featureReferenceSchema).optional().default([]),
  }),
});

const displayTagSchema = z.object({
  featureType: nonBlankText,
  name: nonBlankText,
  icon: nonBlankText,
});

export function projectTftCosmetics(
  value: unknown,
  catalog: TftCosmeticCatalog,
  channel: CommunityDragonChannel,
  featureTagsByContentId: ReadonlyMap<string, readonly TftCosmeticFeatureTag[]> = new Map(),
): readonly TftCosmetic[] {
  if (!Array.isArray(value))
    throw new Error("TFT cosmetic collection must be an array");

  const itemIds = new Set<number>();
  const items = value.map((entry, index) => {
    let item: z.infer<typeof baseItemSchema>;
    try {
      item = baseItemSchema.parse(entry);
    } catch (cause) {
      throw new Error("TFT cosmetic entry " + index + " failed validation", { cause });
    }
    if (itemIds.has(item.itemId))
      throw new Error("TFT cosmetic collection contains duplicate itemId " + item.itemId);
    itemIds.add(item.itemId);

    let imageUrl: string;
    let previewUrl: string;
    try {
      imageUrl = communityDragonAssetUrl(item.loadoutsIcon, channel);
      previewUrl = communityDragonAssetUrl(
        catalog === "portals" ? item.largeLoadoutsIcon ?? item.loadoutsIcon : item.loadoutsIcon,
        channel,
      );
    } catch (cause) {
      throw new Error("TFT cosmetic " + item.itemId + " has an invalid image path", { cause });
    }

    return {
      itemId: item.itemId,
      contentId: item.contentId,
      name: item.name,
      TFTRarity: item.TFTRarity,
      imageUrl,
      previewUrl,
      featureTags: featureTagsByContentId.get(item.contentId) ?? [],
    };
  });

  return items.sort((left, right) => right.itemId - left.itemId);
}

export function indexTftCosmeticFeatureTags(
  contentValue: unknown,
  displayValue: unknown,
  catalog: TftCosmeticCatalog,
  channel: CommunityDragonChannel,
): ReadonlyMap<string, readonly TftCosmeticFeatureTag[]> {
  if (!Array.isArray(contentValue) || !Array.isArray(displayValue))
    throw new Error("TFT feature metadata must be arrays");

  const displayTags = new Map<string, TftCosmeticFeatureTag>();
  for (const entry of displayValue) {
    const parsed = z.object({ TFTFeatureDisplayTag: displayTagSchema.optional() }).safeParse(entry);
    if (!parsed.success || !parsed.data.TFTFeatureDisplayTag) continue;
    const tag = parsed.data.TFTFeatureDisplayTag;
    displayTags.set(tag.featureType, {
      featureType: tag.featureType,
      name: tag.name,
      iconUrl: communityDragonAssetUrl(tag.icon, channel),
    });
  }

  const result = new Map<string, readonly TftCosmeticFeatureTag[]>();
  for (const entry of contentValue) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    const content = catalog === "booms" ? record.TFTDamageSkin : record.TFTZoomSkin;
    const parsed = contentRecordSchema.safeParse(content);
    if (!parsed.success) continue;
    const tags = parsed.data.contentData.featureTags
      .map(({ featureType }) => displayTags.get(featureType))
      .filter((tag): tag is TftCosmeticFeatureTag => tag !== undefined);
    if (tags.length) result.set(parsed.data.id, tags);
  }
  return result;
}

export function addTftCosmeticSearchAliases(
  items: readonly TftCosmetic[],
  localizedItems: readonly TftCosmetic[],
): readonly TftCosmetic[] {
  const namesByItemId = new Map(
    localizedItems.map(({ itemId, name }) => [itemId, name]),
  );
  return items.map((item) => {
    const alias = namesByItemId.get(item.itemId);
    return alias && alias !== item.name
      ? { ...item, searchAliases: [alias] }
      : item;
  });
}

export function withTftCosmeticFeatureTags(
  items: readonly TftCosmetic[],
  tagsByContentId: ReadonlyMap<string, readonly TftCosmeticFeatureTag[]>,
): readonly TftCosmetic[] {
  return items.map((item) => ({
    ...item,
    featureTags: tagsByContentId.get(item.contentId) ?? [],
  }));
}

export function markPbeTftCosmeticAdditions(
  pbeItems: readonly TftCosmetic[],
  liveItems: readonly TftCosmetic[],
): readonly TftCosmetic[] {
  const liveIds = new Set(liveItems.map(({ itemId }) => itemId));
  return pbeItems.map((item) =>
    liveIds.has(item.itemId) ? item : { ...item, isPbeAddition: true },
  );
}

function compareCosmetics(
  left: TftCosmetic,
  right: TftCosmetic,
  locale: CommunityDragonLocalizationView,
  sort: TftCosmeticSort,
): number {
  const pbeOrder =
    Number(right.isPbeAddition === true) - Number(left.isPbeAddition === true);
  if (pbeOrder) return pbeOrder;

  let primary = 0;
  switch (sort) {
    case "id_asc":
      primary = left.itemId - right.itemId;
      break;
    case "rarity_desc":
      primary =
        TFT_COSMETIC_TIER_ORDER.indexOf(left.TFTRarity) -
        TFT_COSMETIC_TIER_ORDER.indexOf(right.TFTRarity);
      break;
    case "rarity_asc":
      primary =
        TFT_COSMETIC_TIER_ORDER.indexOf(right.TFTRarity) -
        TFT_COSMETIC_TIER_ORDER.indexOf(left.TFTRarity);
      break;
    case "name_asc":
      primary = left.name.localeCompare(right.name, locale === "zh_cn" ? "zh-CN" : "en");
      break;
    case "name_desc":
      primary = right.name.localeCompare(left.name, locale === "zh_cn" ? "zh-CN" : "en");
      break;
    case "default":
      break;
  }
  return primary || right.itemId - left.itemId;
}

export function filterTftCosmetics(
  items: readonly TftCosmetic[],
  filters: TftCosmeticFilters,
  locale: CommunityDragonLocalizationView,
): readonly TftCosmetic[] {
  const language = locale === "zh_cn" ? "zh-CN" : "en";
  const query = (filters.search ?? "").trim().toLocaleLowerCase(language);
  const selectedFeatures = new Set(filters.featureTypes ?? []);
  return [...items]
    .filter((item) =>
      (!filters.onlyPbeAdditions || item.isPbeAddition === true) &&
      (!filters.TFTRarity || item.TFTRarity === filters.TFTRarity) &&
      (!selectedFeatures.size || item.featureTags.some(({ featureType }) => selectedFeatures.has(featureType))) &&
      (!query || [item.name, ...(item.searchAliases ?? [])].some((name) =>
        name.toLocaleLowerCase(language).includes(query),
      )),
    )
    .sort((left, right) => compareCosmetics(left, right, locale, filters.sort ?? "default"));
}
