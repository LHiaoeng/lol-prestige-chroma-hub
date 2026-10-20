import type {
  CommunityDragonLocale,
  RuntimeChampionSummary,
  RuntimeSkin,
} from "./communitydragon-runtime";
import { readRuntimeUrlState } from "./runtime-url-state";
import {
  compareRuntimeSkinReferenceItems,
  projectSkinReferenceCollectionItems,
  type RuntimeSkinReferenceItem,
} from "./skin-reference-projection";
import type { RuntimeChannel } from "./communitydragon-runtime";

export type SkinCatalogSort = "asc" | "desc";
export const UNMARKED_RARITY = "unmarked";

export interface SkinCatalogFilters {
  readonly locale: CommunityDragonLocale;
  readonly search: string;
  readonly rarities: readonly string[];
  readonly excludeClassic: boolean;
  readonly sort: SkinCatalogSort;
}

export interface SkinCatalogUrlState {
  readonly search: string;
  readonly rarities: readonly string[];
  readonly excludeClassic: boolean;
  readonly sort: SkinCatalogSort;
  readonly channel: RuntimeChannel;
  readonly channelExplicit: boolean;
  readonly invalid: readonly ("q" | "rarity" | "sort" | "channel" | "excludeClassic")[];
}

export function projectSkinCatalogItems(
  skins: readonly RuntimeSkin[],
  champions: readonly RuntimeChampionSummary[],
): readonly RuntimeSkinReferenceItem[] {
  const names = new Map(champions.map((champion) => [champion.id, champion.name]));
  return projectSkinReferenceCollectionItems(skins)
    .filter((item) => !item.isBase)
    .map((item) => ({
      ...item,
      championName: names.get(item.championId) ?? item.championName,
    }));
}

export function catalogRarityKey(
  item: RuntimeSkinReferenceItem,
  locale: CommunityDragonLocale,
): string {
  if (locale === "zh_cn")
    return item.rarity?.id === undefined ? "" : `id:${item.rarity.id}`;
  return item.rarity?.key === undefined ? "" : `key:${item.rarity.key}`;
}

function isClassicSkinName(name: string | undefined): boolean {
  return /^(?:经典|classic\b)/i.test(name ?? "");
}

export function filterSkinCatalogItems(
  items: readonly RuntimeSkinReferenceItem[],
  { locale, search, rarities, excludeClassic, sort }: SkinCatalogFilters,
): readonly RuntimeSkinReferenceItem[] {
  const language = locale === "zh_cn" ? "zh-CN" : "en";
  const query = search.trim().toLocaleLowerCase(language);
  const selected = new Set(rarities);
  const result = items.filter((item) => {
    const rarity = catalogRarityKey(item, locale) || UNMARKED_RARITY;
    return (
      (selected.size === 0 || selected.has(rarity)) &&
      (!excludeClassic || !isClassicSkinName(item.name)) &&
      (!query ||
        (item.name ?? "").toLocaleLowerCase(language).includes(query) ||
        (item.championName ?? "").toLocaleLowerCase(language).includes(query))
    );
  });
  return result.sort(
    (left, right) =>
      (left.championName ?? "").localeCompare(
        right.championName ?? "",
        language,
      ) * (sort === "asc" ? 1 : -1) ||
      left.championId - right.championId ||
      compareRuntimeSkinReferenceItems(left, right),
  );
}

const rarityParameter = /^(?:unmarked|key:[A-Za-z][A-Za-z0-9]*|id:[1-9]\d*)$/;

export function readSkinCatalogUrlState(url: URL): SkinCatalogUrlState {
  const runtime = readRuntimeUrlState(url);
  const rawSort = url.searchParams.get("sort");
  const rawExcludeClassic = url.searchParams.get("excludeClassic");
  const rawRarities = url.searchParams.getAll("rarity");
  const invalid: SkinCatalogUrlState["invalid"][number][] = [];
  if (runtime.invalid.includes("channel")) invalid.push("channel");
  if (rawSort !== null && rawSort !== "asc" && rawSort !== "desc")
    invalid.push("sort");
  if (rawExcludeClassic !== null && rawExcludeClassic !== "1")
    invalid.push("excludeClassic");
  if (rawRarities.some((value) => !rarityParameter.test(value)))
    invalid.push("rarity");
  return {
    search: url.searchParams.get("q") ?? "",
    rarities: [...new Set(rawRarities.filter((value) => rarityParameter.test(value)))],
    excludeClassic: rawExcludeClassic === "1",
    sort: rawSort === "desc" ? "desc" : "asc",
    channel: runtime.channel ?? "pbe",
    channelExplicit: runtime.channelExplicit,
    invalid,
  };
}

export function formatSkinCatalogUrl(
  url: URL,
  state: Pick<SkinCatalogUrlState, "search" | "rarities" | "excludeClassic" | "sort" | "channel"> &
    Partial<Pick<SkinCatalogUrlState, "channelExplicit">>,
): URL {
  const next = new URL(url);
  next.search = "";
  const search = state.search.trim();
  if (search) next.searchParams.set("q", search);
  for (const rarity of new Set(state.rarities)) {
    if (rarityParameter.test(rarity)) next.searchParams.append("rarity", rarity);
  }
  if (state.excludeClassic) next.searchParams.set("excludeClassic", "1");
  if (state.sort === "desc") next.searchParams.set("sort", "desc");
  if (state.channel === "latest" || state.channelExplicit)
    next.searchParams.set("channel", state.channel);
  return next;
}
