import { z } from "zod";
import {
  communityDragonAssetUrl,
  type CommunityDragonChannel,
} from "./communitydragon-url";
import type { CommunityDragonLocale } from "./communitydragon-runtime";

const TFT_COMPANION_TYPES = ["kLittleLegend", "kChibi", "kStyle2"] as const;
const TFT_COMPANION_RARITIES = [
  "kStandard",
  "kLegendary",
  "kMythic",
  "kPrestige",
] as const;

export type TftCompanionType = (typeof TFT_COMPANION_TYPES)[number];
export type TftCompanionRarity = (typeof TFT_COMPANION_RARITIES)[number];

export function isTftCompanionType(value: string): value is TftCompanionType {
  return (TFT_COMPANION_TYPES as readonly string[]).includes(value);
}

export function isTftCompanionRarity(
  value: string,
): value is TftCompanionRarity {
  return (TFT_COMPANION_RARITIES as readonly string[]).includes(value);
}

export interface TftCompanion {
  readonly itemId: number;
  readonly companionType: TftCompanionType;
  readonly name: string;
  readonly speciesId: number;
  readonly speciesName: string;
  readonly level: number;
  readonly TFTRarity: TftCompanionRarity;
  readonly imageUrl: string;
}

export interface TftCompanionFilters {
  readonly search?: string;
  readonly companionType?: TftCompanionType;
  readonly speciesId?: number;
  readonly TFTRarity?: TftCompanionRarity;
  readonly level?: number;
}

export const TFT_COMPANION_BATCH_SIZE = 50;

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
  return (
    left.name.localeCompare(right.name, locale === "zh_cn" ? "zh-CN" : "en") ||
    left.level - right.level ||
    left.itemId - right.itemId
  );
}

export function sortTftCompanions(
  items: readonly TftCompanion[],
  locale: CommunityDragonLocale,
): readonly TftCompanion[] {
  return [...items].sort((left, right) =>
    compareTftCompanions(left, right, locale),
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
        (filters.companionType === undefined ||
          item.companionType === filters.companionType) &&
        (filters.speciesId === undefined ||
          item.speciesId === filters.speciesId) &&
        (filters.TFTRarity === undefined ||
          item.TFTRarity === filters.TFTRarity) &&
        (filters.level === undefined || item.level === filters.level) &&
        (!query ||
          item.name.toLocaleLowerCase(language).includes(query) ||
          item.speciesName.toLocaleLowerCase(language).includes(query)),
    ),
    locale,
  );
}

export function paginateTftCompanions(
  items: readonly TftCompanion[],
  pageIndex: number,
): readonly TftCompanion[] {
  if (!Number.isSafeInteger(pageIndex) || pageIndex < 0)
    throw new RangeError(
      "TFT companion page index must be a non-negative safe integer",
    );
  const start = pageIndex * TFT_COMPANION_BATCH_SIZE;
  return items.slice(start, start + TFT_COMPANION_BATCH_SIZE);
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
