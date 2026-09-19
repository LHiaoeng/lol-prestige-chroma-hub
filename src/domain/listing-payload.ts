import type { PbeGraph, ChampionRecord, SkinRecord, SkinlineRecord, UniverseRecord } from './communitydragon-content';
import { localizedPath, type Locale } from '../i18n/config';

export const LISTING_KINDS = ['champions', 'skins', 'skinlines', 'universes'] as const;
export type ListingKind = (typeof LISTING_KINDS)[number];

export function isListingKind(value: string): value is ListingKind {
  return (LISTING_KINDS as readonly string[]).includes(value);
}

export interface ListingItem {
  id: number;
  name: string;
  meta?: string;
  image?: string;
  href: string;
}

export interface ListingPayload {
  items: ListingItem[];
}

interface NamedRecord {
  nameEn: string;
  nameZh?: string | null;
}

function localize(record: NamedRecord, locale: Locale): string {
  return locale === 'zh-cn' ? record.nameZh ?? record.nameEn : record.nameEn;
}

export function buildListingPayload(kind: ListingKind, graph: PbeGraph, locale: Locale): ListingPayload {
  const isZh = locale === 'zh-cn';
  switch (kind) {
    case 'champions':
      return {
        items: graph.champions.map((champion: ChampionRecord) => ({
          id: champion.id,
          name: localize(champion, locale),
          meta: isZh ? champion.titleZh ?? champion.titleEn : champion.titleEn,
          image: champion.portraitUrl,
          href: localizedPath(locale, `/champions/${champion.slug}/`),
        })),
      };
    case 'skins':
      return {
        items: graph.skins.map((skin: SkinRecord) => {
          const champion = graph.championsById.get(skin.championId);
          const championName = champion ? localize(champion, locale) : String(skin.championId);
          return {
            id: skin.id,
            name: localize(skin, locale),
            meta: championName,
            image: skin.media.tileUrl ?? skin.media.focusedSplashUrl,
            href: localizedPath(locale, `/skins/${skin.slug}/`),
          };
        }),
      };
    case 'skinlines':
      return {
        items: graph.skinlines.map((line: SkinlineRecord) => {
          const count = graph.skinsBySkinlineId.get(line.id)?.length ?? 0;
          return {
            id: line.id,
            name: localize(line, locale),
            meta: `${count} ${isZh ? '款皮肤' : 'skins'}`,
            href: localizedPath(locale, `/skinlines/${line.slug}/`),
          };
        }),
      };
    case 'universes':
      return {
        items: graph.universes.map((universe: UniverseRecord) => ({
          id: universe.id,
          name: localize(universe, locale),
          meta: isZh ? universe.descriptionZh ?? universe.descriptionEn : universe.descriptionEn,
          image: universe.imageUrl,
          href: localizedPath(locale, `/universes/${universe.slug}/`),
        })),
      };
  }
}
