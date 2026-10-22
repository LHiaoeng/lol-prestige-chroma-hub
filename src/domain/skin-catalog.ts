import type {
  CommunityDragonLocale,
  RuntimeChampionSummary,
  RuntimeSkinline,
  RuntimeSkin,
  RuntimeUniverse,
} from "./communitydragon-runtime";
import { readRuntimeUrlState } from "./runtime-url-state";
import {
  compareRuntimeSkinReferenceItems,
  projectSkinReferenceCollectionItems,
  type RuntimeSkinReferenceItem,
} from "./skin-reference-projection";
import type { RuntimeChannel } from "./communitydragon-runtime";

export type SkinCatalogSort = "asc" | "desc" | "release_desc" | "release_asc";
export type SkinCatalogView = "cards" | "timeline" | "skinline" | "universe";
export type SkinCatalogReleaseDate = {
  readonly globalReleaseDate: string | null;
  readonly chinaReleaseDate: string | null;
  readonly globalReleaseVersion?: string | null;
  readonly chinaReleaseVersion?: string | null;
};
export const UNMARKED_RARITY = "unmarked";

export type SkinCatalogTimelineGroup =
  | { readonly kind: "pbe" | "unknown" | "classic"; readonly items: readonly RuntimeSkinReferenceItem[] }
  | { readonly kind: "date"; readonly date: string; readonly items: readonly RuntimeSkinReferenceItem[] }
  | SkinCatalogEntityGroup;

export interface SkinCatalogEntityGroup {
  readonly kind: "skinline" | "universe";
  readonly id: number;
  readonly name?: string;
  readonly items: readonly RuntimeSkinReferenceItem[];
}

export interface SkinCatalogFilters {
  readonly locale: CommunityDragonLocale;
  readonly search: string;
  readonly rarities: readonly string[];
  readonly classicOnly: boolean;
  readonly onlyPbeAdditions?: boolean;
  readonly sort: SkinCatalogSort;
  readonly channel: RuntimeChannel;
  readonly releaseDates: ReadonlyMap<number, SkinCatalogReleaseDate>;
  readonly pbeNewSkinIds: ReadonlySet<number>;
}

export interface SkinCatalogUrlState {
  readonly search: string;
  readonly rarities: readonly string[];
  readonly classicOnly: boolean;
  readonly onlyPbeAdditions: boolean;
  readonly sort: SkinCatalogSort;
  readonly view: SkinCatalogView;
  readonly channel: RuntimeChannel;
  readonly channelExplicit: boolean;
  readonly invalid: readonly ("q" | "rarity" | "sort" | "channel" | "classicOnly" | "pbeOnly")[];
}

export function skinCatalogReleaseDate(
  item: RuntimeSkinReferenceItem,
  locale: CommunityDragonLocale,
  releaseDates: ReadonlyMap<number, SkinCatalogReleaseDate>,
): { readonly date: string; readonly source: "china" | "global" | "wiki" } | undefined {
  const dates = releaseDates.get(item.skinId);
  if (locale === "zh_cn" && dates?.chinaReleaseDate)
    return { date: dates.chinaReleaseDate, source: "china" };
  if (dates?.globalReleaseDate)
    return { date: dates.globalReleaseDate, source: locale === "zh_cn" ? "global" : "wiki" };
  return undefined;
}

export function skinCatalogReleaseVersion(
  item: RuntimeSkinReferenceItem,
  locale: CommunityDragonLocale,
  releaseDates: ReadonlyMap<number, SkinCatalogReleaseDate>,
): string | undefined {
  const release = releaseDates.get(item.skinId);
  if (!release)
    return undefined;
  if (locale !== "zh_cn")
    return release.globalReleaseVersion ?? undefined;
  if (release.chinaReleaseDate)
    return release.chinaReleaseVersion ?? undefined;
  if (release.globalReleaseDate)
    return release.globalReleaseVersion ?? undefined;
  return release.chinaReleaseVersion ?? release.globalReleaseVersion ?? undefined;
}

function compareSeriesThenChampion(
  left: RuntimeSkinReferenceItem,
  right: RuntimeSkinReferenceItem,
  locale: CommunityDragonLocale,
): number {
  return (left.skinlineIds[0] ?? Number.MAX_SAFE_INTEGER) - (right.skinlineIds[0] ?? Number.MAX_SAFE_INTEGER)
    || (left.championName ?? "").localeCompare(right.championName ?? "", locale === "zh_cn" ? "zh-CN" : "en")
    || left.championId - right.championId
    || compareRuntimeSkinReferenceItems(left, right);
}

export function groupSkinCatalogTimelineItems(
  items: readonly RuntimeSkinReferenceItem[],
  { locale, channel, sort, releaseDates, pbeNewSkinIds }: Pick<SkinCatalogFilters, "locale" | "channel" | "sort" | "releaseDates" | "pbeNewSkinIds">,
): readonly SkinCatalogTimelineGroup[] {
  const pbe: RuntimeSkinReferenceItem[] = [];
  const unknown: RuntimeSkinReferenceItem[] = [];
  const classic: RuntimeSkinReferenceItem[] = [];
  const byDate = new Map<string, RuntimeSkinReferenceItem[]>();
  for (const item of items.toSorted((left, right) => compareSeriesThenChampion(left, right, locale))) {
    if (channel === "pbe" && pbeNewSkinIds.has(item.skinId)) {
      pbe.push(item);
      continue;
    }
    const date = skinCatalogReleaseDate(item, locale, releaseDates)?.date;
    if (!date) {
      // shortcut: an undated non-classic skin may be older, add explicit release status if that appears.
      (isClassicSkinName(item.name) ? classic : unknown).push(item);
      continue;
    }
    const group = byDate.get(date) ?? [];
    group.push(item);
    byDate.set(date, group);
  }
  const dates: SkinCatalogTimelineGroup[] = [...byDate]
    .sort(([left], [right]) => left.localeCompare(right) * (sort === "release_desc" ? -1 : 1))
    .map(([date, grouped]) => ({ kind: "date", date, items: grouped }));
  return [
    ...(pbe.length ? [{ kind: "pbe" as const, items: pbe }] : []),
    ...(unknown.length ? [{ kind: "unknown" as const, items: unknown }] : []),
    ...dates,
    ...(classic.length ? [{ kind: "classic" as const, items: classic }] : []),
  ];
}

export function getSkinCatalogTimelinePageEnd(
  groups: readonly SkinCatalogTimelineGroup[],
  start: number,
  targetSize = 50,
): number {
  let end = start;
  let count = 0;
  while (end < groups.length && (count < targetSize || end === start)) {
    count += groups[end].items.length;
    end += 1;
  }
  return end;
}

export function groupSkinCatalogItemsByEntity(
  items: readonly RuntimeSkinReferenceItem[],
  kind: SkinCatalogEntityGroup["kind"],
  locale: CommunityDragonLocale,
  entities: readonly (RuntimeSkinline | RuntimeUniverse)[] = [],
): readonly SkinCatalogEntityGroup[] {
  const groups = new Map<number, RuntimeSkinReferenceItem[]>();
  const entityById = new Map(entities.filter((entity) => entity.kind === kind).map((entity) => [entity.id, entity]));
  const universesBySkinline = new Map<number, number[]>();
  if (kind === "universe") {
    for (const entity of entityById.values()) {
      if (entity.kind !== "universe") continue;
      for (const skinlineId of entity.skinlineIds) {
        const universeIds = universesBySkinline.get(skinlineId) ?? [];
        universeIds.push(entity.id);
        universesBySkinline.set(skinlineId, universeIds);
      }
    }
  }
  for (const item of items) {
    const ids = new Set(kind === "skinline" ? item.skinlineIds : item.universeIds);
    if (kind === "universe") {
      for (const skinlineId of item.skinlineIds) {
        for (const universeId of universesBySkinline.get(skinlineId) ?? []) {
          if (!item.universeIds.length || item.universeIds.includes(universeId)) ids.add(universeId);
        }
      }
    }
    for (const id of ids) {
      const group = groups.get(id) ?? [];
      group.push(item);
      groups.set(id, group);
    }
  }
  return [...groups]
    .map(([id, groupItems]) => ({ kind, id, name: entityById.get(id)?.name, items: groupItems }))
    .sort((left, right) =>
      (left.name ?? "").localeCompare(right.name ?? "", locale === "zh_cn" ? "zh-CN" : "en") || left.id - right.id,
    );
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
  { locale, search, rarities, classicOnly, onlyPbeAdditions = false, sort, channel, releaseDates, pbeNewSkinIds }: SkinCatalogFilters,
): readonly RuntimeSkinReferenceItem[] {
  const language = locale === "zh_cn" ? "zh-CN" : "en";
  const query = search.trim().toLocaleLowerCase(language);
  const selected = new Set(rarities);
  const result = items.filter((item) => {
    const rarity = catalogRarityKey(item, locale) || UNMARKED_RARITY;
    return (
      (selected.size === 0 || selected.has(rarity)) &&
      (!classicOnly || isClassicSkinName(item.name)) &&
      (!onlyPbeAdditions || channel !== "pbe" || pbeNewSkinIds.has(item.skinId)) &&
      (!query ||
        (item.name ?? "").toLocaleLowerCase(language).includes(query) ||
        (item.championName ?? "").toLocaleLowerCase(language).includes(query))
    );
  });
  if (sort === "release_desc" || sort === "release_asc") {
    const dateFor = (item: RuntimeSkinReferenceItem) => {
      return skinCatalogReleaseDate(item, locale, releaseDates)?.date;
    };
    const tieBreak = (left: RuntimeSkinReferenceItem, right: RuntimeSkinReferenceItem) =>
      compareSeriesThenChampion(left, right, locale);
    return result.sort((left, right) => {
      const leftNew = channel === "pbe" && pbeNewSkinIds.has(left.skinId);
      const rightNew = channel === "pbe" && pbeNewSkinIds.has(right.skinId);
      if (leftNew !== rightNew) return leftNew ? -1 : 1;
      if (leftNew) return tieBreak(left, right);
      const leftDate = dateFor(left);
      const rightDate = dateFor(right);
      const leftUndated = !leftDate && !isClassicSkinName(left.name);
      const rightUndated = !rightDate && !isClassicSkinName(right.name);
      if (leftUndated !== rightUndated) return leftUndated ? -1 : 1;
      if (!leftDate || !rightDate) {
        if (!!leftDate !== !!rightDate) return leftDate ? -1 : 1;
      } else if (leftDate !== rightDate) {
        return leftDate.localeCompare(rightDate) * (sort === "release_desc" ? -1 : 1);
      }
      return tieBreak(left, right);
    });
  }
  return result.sort((left, right) =>
    (left.championName ?? "").localeCompare(right.championName ?? "", language) * (sort === "asc" ? 1 : -1) ||
    left.championId - right.championId || compareRuntimeSkinReferenceItems(left, right),
  );
}

const rarityParameter = /^(?:unmarked|key:[A-Za-z][A-Za-z0-9]*|id:[1-9]\d*)$/;

export function readSkinCatalogUrlState(url: URL): SkinCatalogUrlState {
  const runtime = readRuntimeUrlState(url);
  const rawSort = url.searchParams.get("sort");
  const rawClassicOnly = url.searchParams.get("classicOnly");
  const rawPbeOnly = url.searchParams.get("pbeOnly");
  const rawView = url.searchParams.get("view");
  const view = rawView === "cards" || rawView === "skinline" || rawView === "universe"
    ? rawView
    : "timeline";
  const rawRarities = url.searchParams.getAll("rarity");
  const invalid: SkinCatalogUrlState["invalid"][number][] = [];
  if (runtime.invalid.includes("channel")) invalid.push("channel");
  if (rawSort !== null && rawSort !== "asc" && rawSort !== "desc" && rawSort !== "release_desc" && rawSort !== "release_asc")
    invalid.push("sort");
  if (rawClassicOnly !== null && rawClassicOnly !== "1")
    invalid.push("classicOnly");
  if (rawPbeOnly !== null && rawPbeOnly !== "1") invalid.push("pbeOnly");
  if (rawRarities.some((value) => !rarityParameter.test(value)))
    invalid.push("rarity");
  return {
    search: url.searchParams.get("q") ?? "",
    rarities: [...new Set(rawRarities.filter((value) => rarityParameter.test(value)))],
    classicOnly: rawClassicOnly === "1",
    onlyPbeAdditions: rawPbeOnly === "1",
    sort: (view === "skinline" || view === "universe") || (view !== "cards" && (rawSort === "asc" || rawSort === "desc"))
      ? "release_desc"
      : rawSort === "asc" || rawSort === "desc" || rawSort === "release_asc" ? rawSort : "release_desc",
    view,
    channel: runtime.channel ?? "pbe",
    channelExplicit: runtime.channelExplicit,
    invalid,
  };
}

export function formatSkinCatalogUrl(
  url: URL,
  state: Pick<SkinCatalogUrlState, "search" | "rarities" | "classicOnly" | "onlyPbeAdditions" | "sort" | "view" | "channel"> &
    Partial<Pick<SkinCatalogUrlState, "channelExplicit">>,
): URL {
  const next = new URL(url);
  next.search = "";
  const search = state.search.trim();
  if (search) next.searchParams.set("q", search);
  for (const rarity of new Set(state.rarities)) {
    if (rarityParameter.test(rarity)) next.searchParams.append("rarity", rarity);
  }
  if (state.classicOnly) next.searchParams.set("classicOnly", "1");
  if (state.onlyPbeAdditions) next.searchParams.set("pbeOnly", "1");
  if (state.sort !== "release_desc") next.searchParams.set("sort", state.sort);
  if (state.view !== "timeline") next.searchParams.set("view", state.view);
  if (state.channel === "latest" || state.channelExplicit)
    next.searchParams.set("channel", state.channel);
  return next;
}
