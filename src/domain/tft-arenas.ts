import { z } from "zod";
import {
  communityDragonAssetUrl,
  type CommunityDragonChannel,
  type CommunityDragonLocalizationView,
} from "./communitydragon-url";

export const TFT_ARENA_RARITY_ORDER = [
  "kPrestige",
  "kMythic",
  "kLegendary",
  "kStandard",
] as const;
export const TFT_ARENA_SORTS = [
  "default",
  "id_asc",
  "rarity_desc",
  "rarity_asc",
  "name_asc",
  "name_desc",
] as const;

export type TftArenaRarity = (typeof TFT_ARENA_RARITY_ORDER)[number];
export type TftArenaSort = (typeof TFT_ARENA_SORTS)[number];

export interface TftArena {
  readonly itemId: number;
  readonly groupId: number;
  readonly isPbeAddition?: boolean;
  readonly name: string;
  readonly groupName: string;
  readonly description?: string;
  readonly TFTRarity: TftArenaRarity;
  readonly imageUrl: string;
  readonly searchAliases?: readonly string[];
}

export interface TftArenaFilters {
  readonly search?: string;
  readonly groupId?: number;
  readonly TFTRarity?: TftArenaRarity;
  readonly onlyPbeAdditions?: boolean;
  readonly sort?: TftArenaSort;
}

export function isTftArenaSort(value: string): value is TftArenaSort {
  return (TFT_ARENA_SORTS as readonly string[]).includes(value);
}

export function isTftArenaRarity(value: string): value is TftArenaRarity {
  return (TFT_ARENA_RARITY_ORDER as readonly string[]).includes(value);
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
const tftArenaSchema = z.object({
  itemId: positiveSafeInteger,
  groupId: nonNegativeSafeInteger,
  name: nonBlankText,
  groupName: nonBlankText,
  description: z.string().optional(),
  TFTRarity: z.enum(TFT_ARENA_RARITY_ORDER),
  loadoutsIcon: nonBlankText,
});

export function projectTftArenas(
  value: unknown,
  channel: CommunityDragonChannel,
): readonly TftArena[] {
  if (!Array.isArray(value))
    throw new Error("TFT arena collection must be an array");

  const ids = new Set<number>();
  const items = value.map((entry, index) => {
    let raw: z.infer<typeof tftArenaSchema>;
    try {
      raw = tftArenaSchema.parse(entry);
    } catch (cause) {
      throw new Error(`TFT arena entry ${index} failed validation`, { cause });
    }
    if (ids.has(raw.itemId))
      throw new Error(
        `TFT arena collection contains duplicate itemId ${raw.itemId}`,
      );
    ids.add(raw.itemId);

    let imageUrl: string;
    try {
      imageUrl = communityDragonAssetUrl(raw.loadoutsIcon, channel);
    } catch (cause) {
      throw new Error(`TFT arena ${raw.itemId} has an invalid loadoutsIcon`, {
        cause,
      });
    }
    return {
      itemId: raw.itemId,
      groupId: raw.groupId,
      name: raw.name,
      groupName: raw.groupName,
      ...(raw.description === undefined ? {} : { description: raw.description }),
      TFTRarity: raw.TFTRarity,
      imageUrl,
    };
  });

  return items.sort((left, right) => right.itemId - left.itemId);
}

export function addTftArenaSearchAliases(
  items: readonly TftArena[],
  localizedItems: readonly TftArena[],
): readonly TftArena[] {
  const namesByItemId = new Map(
    localizedItems.map(({ itemId, name }) => [itemId, name]),
  );
  const groupNamesById = new Map(
    localizedItems.map(({ groupId, groupName }) => [groupId, groupName]),
  );
  return items.map((item) => {
    const searchAliases = [
      namesByItemId.get(item.itemId),
      groupNamesById.get(item.groupId),
    ].filter((name): name is string => name !== undefined);
    return searchAliases.length ? { ...item, searchAliases } : item;
  });
}

export function markPbeTftArenaAdditions(
  pbeItems: readonly TftArena[],
  liveItems: readonly TftArena[],
): readonly TftArena[] {
  const liveItemIds = new Set(liveItems.map(({ itemId }) => itemId));
  return pbeItems.map((item) =>
    liveItemIds.has(item.itemId) ? item : { ...item, isPbeAddition: true },
  );
}

function compareTftArenas(
  left: TftArena,
  right: TftArena,
  locale: CommunityDragonLocalizationView,
  sort: TftArenaSort,
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
        TFT_ARENA_RARITY_ORDER.indexOf(left.TFTRarity) -
        TFT_ARENA_RARITY_ORDER.indexOf(right.TFTRarity);
      break;
    case "rarity_asc":
      primary =
        TFT_ARENA_RARITY_ORDER.indexOf(right.TFTRarity) -
        TFT_ARENA_RARITY_ORDER.indexOf(left.TFTRarity);
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
    case "default":
      break;
  }
  return primary || right.itemId - left.itemId;
}

export function sortTftArenas(
  items: readonly TftArena[],
  locale: CommunityDragonLocalizationView,
  sort: TftArenaSort = "default",
): readonly TftArena[] {
  return [...items].sort((left, right) =>
    compareTftArenas(left, right, locale, sort),
  );
}

export function filterTftArenas(
  items: readonly TftArena[],
  filters: TftArenaFilters,
  locale: CommunityDragonLocalizationView,
): readonly TftArena[] {
  const language = locale === "zh_cn" ? "zh-CN" : "en";
  const query = (filters.search ?? "").trim().toLocaleLowerCase(language);
  return sortTftArenas(
    items.filter(
      (item) =>
        (!filters.onlyPbeAdditions || item.isPbeAddition === true) &&
        (filters.groupId === undefined || item.groupId === filters.groupId) &&
        (filters.TFTRarity === undefined ||
          item.TFTRarity === filters.TFTRarity) &&
        (!query ||
          [item.name, item.groupName, ...(item.searchAliases ?? [])].some(
            (name) => name.toLocaleLowerCase(language).includes(query),
          )),
    ),
    locale,
    filters.sort,
  );
}
