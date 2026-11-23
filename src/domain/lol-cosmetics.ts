import type { RuntimeEmote, RuntimeNexusFinisher, RuntimeSummonerIcon, RuntimeWardSkin, RuntimeWardSkinSet } from './communitydragon-runtime';
import { readRuntimeUrlState } from './runtime-url-state';

export const lolCosmeticCatalogs = [
  { slug: 'summoner-icons', en: 'Summoner Icons', 'zh-cn': '召唤师图标' },
  { slug: 'emotes', en: 'Emotes', 'zh-cn': '表情' },
  { slug: 'ward-skins', en: 'Ward Skins', 'zh-cn': '守卫皮肤' },
  { slug: 'nexus-finishers', en: 'Nexus Finishers', 'zh-cn': '终结特效' },
] as const;

export type LolCosmeticCatalog = typeof lolCosmeticCatalogs[number];
export type LolCosmetic = RuntimeSummonerIcon | RuntimeEmote | RuntimeWardSkin | RuntimeNexusFinisher;
export type LolCosmeticSort = 'newest' | 'oldest';

export function wardSetIndex(sets: readonly RuntimeWardSkinSet[]): ReadonlyMap<number, RuntimeWardSkinSet> {
  return new Map(sets.flatMap((set) => set.wards.map((id) => [id, set] as const)));
}

export function wardViewGroup(
  item: LolCosmetic,
  view: 'sets' | 'rarity',
  sets: ReadonlyMap<number, RuntimeWardSkinSet>,
) {
  if (view === 'sets') {
    const set = sets.get(item.id);
    return { key: set ? `set-${set.id}` : 'unknown', label: set?.displayName, rank: 0 };
  }
  const rarity = cosmeticRarity(item);
  return { key: rarity?.id ? `rarity-${rarity.id}` : 'unknown', label: rarity?.label, rank: rarity?.id ?? 0 };
}

export function orderWardView(items: readonly LolCosmetic[], view: 'sets' | 'rarity', sets: ReadonlyMap<number, RuntimeWardSkinSet>, locale: string) {
  return [...items].sort((left, right) => {
    const a = wardViewGroup(left, view, sets);
    const b = wardViewGroup(right, view, sets);
    if (a.key === b.key) return 0;
    if (a.key === 'unknown') return 1;
    if (b.key === 'unknown') return -1;
    return b.rank - a.rank || (a.label ?? '').localeCompare(b.label ?? '', locale) || a.key.localeCompare(b.key);
  });
}

// The collection groups by catalog releaseDate. See the CD guide for the source and scope.
const finisherReleaseYears: Readonly<Partial<Record<number, number>>> = {
  1: 2024,
  2: 2025,
  3: 2025,
  4: 2025,
  5: 2025,
  6: 2026,
  7: 2026,
};

export function cosmeticTimelineKey(item: LolCosmetic, additions: ReadonlySet<number>) {
  if (additions.has(item.id)) return 'pbe';
  if (item.kind === 'finisher') return finisherReleaseYears[item.id] ?? 'unknown';
  return item.kind === 'icon' && item.yearReleased ? item.yearReleased : 'unknown';
}

export function orderCosmeticTimeline(items: readonly LolCosmetic[], additions: ReadonlySet<number>, sort: LolCosmeticSort) {
  const rank = (item: LolCosmetic) => {
    const key = cosmeticTimelineKey(item, additions);
    if (key === 'pbe') return -Infinity;
    if (key === 'unknown') return Infinity;
    return sort === 'oldest' ? key : -key;
  };
  return [...items].sort((a, b) => rank(a) - rank(b));
}

export function readLolCosmeticFilters(url: URL, hasCategory: boolean, hasRarity = false) {
  const filter = url.searchParams.get('category') ?? '';
  const rarity = url.searchParams.get('rarity') ?? '';
  const channel = readRuntimeUrlState(url).channel ?? 'pbe';
  return {
    query: url.searchParams.get('q') ?? '',
    channel,
    onlyPbeAdditions: channel === 'pbe' && url.searchParams.get('pbe') === '1',
    category: hasCategory && /^[1-9]\d*$/.test(filter) && Number.isSafeInteger(Number(filter)) ? filter : '',
    rarity: hasRarity && /^[1-9]\d*$/.test(rarity) && Number.isSafeInteger(Number(rarity)) ? rarity : '',
    sort: url.searchParams.get('sort') === 'oldest' ? 'oldest' as const : 'newest' as const,
  };
}

export function inheritLolCosmeticChannel(href: string, source: URL): URL {
  const target = new URL(href, source);
  if (readRuntimeUrlState(source).channel === 'latest') target.searchParams.set('channel', 'latest');
  else target.searchParams.delete('channel');
  return target;
}

export function cosmeticLanguageUrl(href: string, current: URL): URL {
  const target = new URL(href, current);
  target.search = current.search;
  target.searchParams.delete('q');
  return target;
}

export function cosmeticName(item: LolCosmetic, locale: string): string {
  return (item.kind === 'icon' ? item.title : item.name) || (locale === 'zh-CN' ? `外观 #${item.id}` : `Cosmetic #${item.id}`);
}

export function cosmeticFilterValues(item: LolCosmetic): readonly number[] {
  if (item.kind === 'icon' && item.yearReleased) return [item.yearReleased];
  if (item.kind === 'emote') return item.taggedChampionIds;
  return [];
}

export function cosmeticRarity(item: LolCosmetic) {
  return 'rarity' in item ? item.rarity : undefined;
}

export function filterLolCosmetics(
  items: readonly LolCosmetic[],
  query: string,
  filter: string,
  locale: string,
  sort: LolCosmeticSort,
  additions?: ReadonlySet<number>,
  rarity = '',
) {
  const needle = query.trim().toLocaleLowerCase(locale);
  return items.filter((item) =>
    cosmeticName(item, locale).toLocaleLowerCase(locale).includes(needle) &&
    (!filter || cosmeticFilterValues(item).includes(Number(filter))) &&
    (!rarity || cosmeticRarity(item)?.id === Number(rarity)),
  ).sort((a, b) => {
    const additionsFirst = Number(additions?.has(b.id) ?? false) - Number(additions?.has(a.id) ?? false);
    return additionsFirst || (sort === 'oldest' ? a.id - b.id : b.id - a.id);
  });
}
