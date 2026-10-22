import { z } from "zod";
import {
  communityDragonAssetUrl,
  type CommunityDragonChannel,
} from "./communitydragon-url";
import type { CommunityDragonLocale } from "./communitydragon-runtime";

export const TFT_COMPANION_TYPE_ORDER = [
  "kStyle2",
  "kChibi",
  "kLittleLegend",
] as const;
export const TFT_COMPANION_RARITY_ORDER = [
  "kPrestige",
  "kMythic",
  "kLegendary",
  "kStandard",
] as const;
export const TFT_COMPANION_SORTS = [
  "default",
  "rarity_desc",
  "rarity_asc",
  "type_desc",
  "type_asc",
  "name_asc",
  "name_desc",
  "stars_desc",
  "stars_asc",
] as const;

const TFT_COMPANION_TYPES = TFT_COMPANION_TYPE_ORDER;
const TFT_COMPANION_RARITIES = TFT_COMPANION_RARITY_ORDER;

export type TftCompanionType = (typeof TFT_COMPANION_TYPES)[number];
export type TftCompanionRarity = (typeof TFT_COMPANION_RARITIES)[number];
export type TftCompanionSort = (typeof TFT_COMPANION_SORTS)[number];

export function isTftCompanionType(value: string): value is TftCompanionType {
  return (TFT_COMPANION_TYPES as readonly string[]).includes(value);
}

export function isTftCompanionRarity(
  value: string,
): value is TftCompanionRarity {
  return (TFT_COMPANION_RARITIES as readonly string[]).includes(value);
}

export function isTftCompanionSort(value: string): value is TftCompanionSort {
  return (TFT_COMPANION_SORTS as readonly string[]).includes(value);
}

export interface TftCompanion {
  readonly itemId: number;
  readonly isPbeAddition?: boolean;
  readonly companionType: TftCompanionType;
  readonly name: string;
  readonly searchAliases?: readonly string[];
  readonly speciesId: number;
  readonly speciesName: string;
  readonly level: number;
  readonly TFTRarity: TftCompanionRarity;
  readonly imageUrl: string;
}

export interface TftCompanionFilters {
  readonly search?: string;
  readonly onlyPbeAdditions?: boolean;
  readonly companionType?: TftCompanionType;
  readonly speciesId?: number;
  readonly TFTRarity?: TftCompanionRarity;
  readonly level?: number;
  readonly sort?: TftCompanionSort;
}

export const TFT_COMPANION_BATCH_SIZE = 50;

export function tftCompanionPageSize(columns: number): number {
  if (!Number.isSafeInteger(columns) || columns < 1)
    throw new RangeError("TFT companion column count must be a positive integer");
  return Math.max(
    columns,
    Math.floor(TFT_COMPANION_BATCH_SIZE / columns) * columns,
  );
}

export function getMultiStarTftCompanionItemIds(
  items: readonly TftCompanion[],
): ReadonlySet<number> {
  const groupKey = (item: TftCompanion) =>
    `${item.companionType}:${item.speciesId}`;
  const levelsByGroup = new Map<string, Set<number>>();
  for (const item of items) {
    const key = groupKey(item);
    const levels = levelsByGroup.get(key) ?? new Set<number>();
    levels.add(item.level);
    levelsByGroup.set(key, levels);
  }
  const multiStarGroups = new Set(
    [...levelsByGroup]
      .filter(([, levels]) => levels.size > 1)
      .map(([key]) => key),
  );
  return new Set(
    items
      .filter((item) => multiStarGroups.has(groupKey(item)))
      .map(({ itemId }) => itemId),
  );
}

export function markPbeTftCompanionAdditions(
  pbeItems: readonly TftCompanion[],
  liveItems: readonly TftCompanion[],
): readonly TftCompanion[] {
  const liveItemIds = new Set(liveItems.map(({ itemId }) => itemId));
  return pbeItems.map((item) =>
    liveItemIds.has(item.itemId) ? item : { ...item, isPbeAddition: true },
  );
}

export function addTftCompanionSearchAliases(
  items: readonly TftCompanion[],
  localizedItems: readonly TftCompanion[],
): readonly TftCompanion[] {
  const namesByItemId = new Map(
    localizedItems.map(({ itemId, name }) => [itemId, name]),
  );
  const speciesNamesById = new Map(
    localizedItems.map(({ speciesId, speciesName }) => [speciesId, speciesName]),
  );
  return items.map((item) => {
    const searchAliases = [
      namesByItemId.get(item.itemId),
      speciesNamesById.get(item.speciesId),
    ].filter((name): name is string => name !== undefined);
    return searchAliases.length ? { ...item, searchAliases } : item;
  });
}

const positiveSafeInteger = z
  .number()
  .int()
  .positive()
  .refine(Number.isSafeInteger);
const nonNegativeSafeInteger = z
  .number()
  .int()
  .nonnegative()
  .refine(Number.isSafeInteger);
const nonBlankText = z.string().refine((value) => value.trim().length > 0);
const tftCompanionSchema = z.object({
  companionType: z.enum(TFT_COMPANION_TYPES),
  itemId: positiveSafeInteger,
  name: nonBlankText,
  speciesId: nonNegativeSafeInteger,
  speciesName: nonBlankText,
  level: positiveSafeInteger,
  TFTRarity: z.enum(TFT_COMPANION_RARITIES),
  loadoutsIcon: nonBlankText,
});

function compareTftCompanions(
  left: TftCompanion,
  right: TftCompanion,
  locale: CommunityDragonLocale,
): number {
  const rarityOrder =
    TFT_COMPANION_RARITY_ORDER.indexOf(left.TFTRarity) -
    TFT_COMPANION_RARITY_ORDER.indexOf(right.TFTRarity);
  if (rarityOrder) return rarityOrder;

  const typeOrder =
    TFT_COMPANION_TYPE_ORDER.indexOf(left.companionType) -
    TFT_COMPANION_TYPE_ORDER.indexOf(right.companionType);
  if (typeOrder) return typeOrder;

  return (
    left.name.localeCompare(right.name, locale === "zh_cn" ? "zh-CN" : "en") ||
    left.level - right.level ||
    left.itemId - right.itemId
  );
}

function compareBySort(
  left: TftCompanion,
  right: TftCompanion,
  locale: CommunityDragonLocale,
  sort: TftCompanionSort,
): number {
  const pbeOrder =
    Number(right.isPbeAddition === true) - Number(left.isPbeAddition === true);
  if (pbeOrder) return pbeOrder;

  let primary = 0;
  switch (sort) {
    case "rarity_desc":
      primary =
        TFT_COMPANION_RARITY_ORDER.indexOf(left.TFTRarity) -
        TFT_COMPANION_RARITY_ORDER.indexOf(right.TFTRarity);
      break;
    case "rarity_asc":
      primary =
        TFT_COMPANION_RARITY_ORDER.indexOf(right.TFTRarity) -
        TFT_COMPANION_RARITY_ORDER.indexOf(left.TFTRarity);
      break;
    case "type_desc":
      primary =
        TFT_COMPANION_TYPE_ORDER.indexOf(left.companionType) -
        TFT_COMPANION_TYPE_ORDER.indexOf(right.companionType);
      break;
    case "type_asc":
      primary =
        TFT_COMPANION_TYPE_ORDER.indexOf(right.companionType) -
        TFT_COMPANION_TYPE_ORDER.indexOf(left.companionType);
      break;
    case "name_asc":
      primary = left.name.localeCompare(
        right.name,
        locale === "zh_cn" ? "zh-CN" : "en",
      );
      break;
    case "name_desc":
      primary = right.name.localeCompare(
        left.name,
        locale === "zh_cn" ? "zh-CN" : "en",
      );
      break;
    case "stars_desc":
      primary = right.level - left.level;
      break;
    case "stars_asc":
      primary = left.level - right.level;
      break;
    case "default":
      break;
  }
  return primary || compareTftCompanions(left, right, locale);
}

export function sortTftCompanions(
  items: readonly TftCompanion[],
  locale: CommunityDragonLocale,
  sort: TftCompanionSort = "default",
): readonly TftCompanion[] {
  return [...items].sort((left, right) =>
    compareBySort(left, right, locale, sort),
  );
}

export function filterTftCompanions(
  items: readonly TftCompanion[],
  filters: TftCompanionFilters,
  locale: CommunityDragonLocale,
): readonly TftCompanion[] {
  const language = locale === "zh_cn" ? "zh-CN" : "en";
  const query = (filters.search ?? "").trim().toLocaleLowerCase(language);
  return sortTftCompanions(
    items.filter(
      (item) =>
        (!filters.onlyPbeAdditions || item.isPbeAddition === true) &&
        (filters.companionType === undefined ||
          item.companionType === filters.companionType) &&
        (filters.speciesId === undefined ||
          item.speciesId === filters.speciesId) &&
        (filters.TFTRarity === undefined ||
          item.TFTRarity === filters.TFTRarity) &&
        (filters.level === undefined || item.level === filters.level) &&
        (!query ||
          [item.name, item.speciesName, ...(item.searchAliases ?? [])].some(
            (name) => name.toLocaleLowerCase(language).includes(query),
          )),
    ),
    locale,
    filters.sort,
  );
}

export function paginateTftCompanions(
  items: readonly TftCompanion[],
  pageIndex: number,
  pageSize = TFT_COMPANION_BATCH_SIZE,
): readonly TftCompanion[] {
  if (
    !Number.isSafeInteger(pageIndex) ||
    pageIndex < 0 ||
    !Number.isSafeInteger(pageSize) ||
    pageSize < 1
  )
    throw new RangeError(
      "TFT companion pagination requires a non-negative page index and positive page size",
    );
  const start = pageIndex * pageSize;
  return items.slice(start, start + pageSize);
}

export function projectTftCompanions(
  value: unknown,
  locale: CommunityDragonLocale,
  channel: CommunityDragonChannel,
): readonly TftCompanion[] {
  if (!Array.isArray(value))
    throw new Error("TFT companion collection must be an array");

  const ids = new Set<number>();
  const items = value.flatMap((entry, index) => {
    let raw: z.infer<typeof tftCompanionSchema>;
    try {
      raw = tftCompanionSchema.parse(entry);
    } catch (cause) {
      throw new Error(`TFT companion entry ${index} failed validation`, {
        cause,
      });
    }
    if (ids.has(raw.itemId))
      throw new Error(
        `TFT companion collection contains duplicate itemId ${raw.itemId}`,
      );
    ids.add(raw.itemId);

    let imageUrl: string;
    try {
      imageUrl = communityDragonAssetUrl(raw.loadoutsIcon, channel);
    } catch (cause) {
      throw new Error(
        `TFT companion ${raw.itemId} has an invalid loadoutsIcon`,
        { cause },
      );
    }
    return [
      {
        itemId: raw.itemId,
        companionType: raw.companionType,
        name: raw.name,
        speciesId: raw.speciesId,
        speciesName: raw.speciesName,
        level: raw.level,
        TFTRarity: raw.TFTRarity,
        imageUrl,
      },
    ];
  });

  return sortTftCompanions(items, locale);
}
