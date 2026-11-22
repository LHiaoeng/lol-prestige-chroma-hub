import type { RuntimeEmote, RuntimeNexusFinisher, RuntimeSummonerIcon, RuntimeWardSkin } from './communitydragon-runtime';
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

export function summonerIconTimelineKey(item: LolCosmetic, additions: ReadonlySet<number>) {
  if (additions.has(item.id)) return 'pbe';
  return item.kind === 'icon' && item.yearReleased ? item.yearReleased : 'unknown';
}

export function orderSummonerIconTimeline(items: readonly LolCosmetic[], additions: ReadonlySet<number>, sort: LolCosmeticSort) {
  const rank = (item: LolCosmetic) => {
    const key = summonerIconTimelineKey(item, additions);
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
