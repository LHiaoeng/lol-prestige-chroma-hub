import { expect, it } from 'vitest';
import { cosmeticLanguageUrl, filterLolCosmetics, inheritLolCosmeticChannel, orderSummonerIconTimeline, readLolCosmeticFilters, type LolCosmetic } from './lol-cosmetics';
import { projectPbeIdDiff } from './pbe-additions';

it('orders the timeline by release year while preserving the input order within each year', () => {
  const icons: LolCosmetic[] = [
    { kind: 'icon', id: 5, yearReleased: 2024 },
    { kind: 'icon', id: 4 },
    { kind: 'icon', id: 3, yearReleased: 2022 },
    { kind: 'icon', id: 2, yearReleased: 2024 },
    { kind: 'icon', id: 1, yearReleased: 2021 },
  ];
  const additions = new Set([1]);
  expect(orderSummonerIconTimeline(icons, additions, 'newest').map(({ id }) => id)).toEqual([1, 5, 2, 3, 4]);
  expect(orderSummonerIconTimeline(icons, additions, 'oldest').map(({ id }) => id)).toEqual([1, 3, 5, 2, 4]);
});

it('keeps same-name cosmetics and applies the year filter including missing years', () => {
  const icons: LolCosmetic[] = [
    { kind: 'icon', id: 3, title: 'Star' },
    { kind: 'icon', id: 2, title: 'Star', yearReleased: 2024 },
    { kind: 'icon', id: 1, title: 'Moon', yearReleased: 2024 },
  ];
  expect(filterLolCosmetics(icons, ' STAR ', '', 'en', 'newest').map(({ id }) => id)).toEqual([3, 2]);
  expect(filterLolCosmetics(icons, ' STAR ', '', 'en', 'oldest').map(({ id }) => id)).toEqual([2, 3]);
  expect(filterLolCosmetics(icons, 'star', '2024', 'en', 'newest').map(({ id }) => id)).toEqual([2]);
  expect(projectPbeIdDiff(icons, icons.slice(1)).map(({ id }) => id)).toEqual([3]);
});

it('combines emote name and associated champion filters', () => {
  const emotes: LolCosmetic[] = [
    { kind: 'emote', id: 1, name: '星光', taggedChampionIds: [103] },
    { kind: 'emote', id: 2, name: '星光', taggedChampionIds: [99] },
    { kind: 'emote', id: 3, name: '晚安', taggedChampionIds: [103] },
  ];
  expect(filterLolCosmetics(emotes, '星', '103', 'zh-CN', 'newest').map(({ id }) => id)).toEqual([1]);
});

it('keeps PBE additions first in either ID sort direction', () => {
  const wards: LolCosmetic[] = [1, 2, 3, 4].map((id) => ({ kind: 'ward', id, name: 'Ward' }));
  const additions = new Set([2, 3]);
  expect(filterLolCosmetics(wards, '', '', 'en', 'newest', additions).map(({ id }) => id)).toEqual([3, 2, 4, 1]);
  expect(filterLolCosmetics(wards, '', '', 'en', 'oldest', additions).map(({ id }) => id)).toEqual([2, 3, 1, 4]);
});

it('restores URL filters and clears only the search when switching languages', () => {
  const url = new URL('https://chromaart.lol/emotes/?channel=latest&q=star&category=103&sort=oldest');
  expect(readLolCosmeticFilters(new URL(url.pathname, url), true)).toEqual({ query: '', channel: 'pbe', onlyPbeAdditions: false, category: '', rarity: '', sort: 'newest' });
  expect(readLolCosmeticFilters(url, true)).toEqual({ query: 'star', channel: 'latest', onlyPbeAdditions: false, category: '103', rarity: '', sort: 'oldest' });
  expect(readLolCosmeticFilters(url, false).category).toBe('');
  const alternate = cosmeticLanguageUrl('/zh-cn/emotes/', url);
  expect(alternate.pathname).toBe('/zh-cn/emotes/');
  expect(readLolCosmeticFilters(alternate, true)).toEqual({ query: '', channel: 'latest', onlyPbeAdditions: false, category: '103', rarity: '', sort: 'oldest' });
});

it('combines rarity with category and name while preserving PBE ordering', () => {
  const icons: LolCosmetic[] = [
    { kind: 'icon', id: 1, title: 'Star', yearReleased: 2025, rarity: { id: 2 } },
    { kind: 'icon', id: 2, title: 'Star', yearReleased: 2025 },
    { kind: 'icon', id: 3, title: 'Star', yearReleased: 2026, rarity: { id: 2 } },
    { kind: 'icon', id: 4, title: 'Starfall', yearReleased: 2025, rarity: { id: 2 } },
  ];
  expect(filterLolCosmetics(icons, 'star', '2025', 'en', 'newest', new Set([1]), '2').map(({ id }) => id)).toEqual([1, 4]);
  const url = new URL('https://chromaart.lol/summoner-icons/?rarity=2');
  expect(readLolCosmeticFilters(url, true, true).rarity).toBe('2');
  expect(readLolCosmeticFilters(url, true).rarity).toBe('');
});

it('inherits Live navigation and keeps PBE additions separate from the data channel', () => {
  const live = new URL('https://chromaart.lol/skins/detail/?id=103001&channel=latest');
  const target = inheritLolCosmeticChannel('/emotes/', live);
  expect(target.search).toBe('?channel=latest');
  target.searchParams.set('pbe', '1');
  expect(readLolCosmeticFilters(target, true).onlyPbeAdditions).toBe(false);
  target.searchParams.delete('channel');
  expect(readLolCosmeticFilters(target, true).onlyPbeAdditions).toBe(true);
  expect(inheritLolCosmeticChannel('/emotes/?channel=latest', new URL('https://chromaart.lol/champions/')).search).toBe('');
});
