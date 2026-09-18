import { z } from 'zod';
import { catalog } from './catalog';
import { championSlug } from '../domain/champion-route';
import { COMMUNITYDRAGON_CHAMPION_SUMMARY_URLS } from '../domain/communitydragon-url';
import type { FetchLike } from './champion-coverage';
import { getCommunityDragonPbeGraph } from './communitydragon-pbe';

const championSummarySchema = z.array(z.object({
  id: z.number().int(),
  name: z.string().trim().min(1),
}));

export interface ChampionIndexEntry {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
}

export function buildChampionIndex(input: unknown, requiredHeroIds: readonly string[] = []): ChampionIndexEntry[] {
  const required = new Set(requiredHeroIds);
  const records = championSummarySchema.parse(input)
    .filter((record) => record.id > 0 && (required.size === 0 || required.has(String(record.id))));
  if (records.length === 0) {
    if (required.size > 0) throw new Error(`Unknown required champion ID: ${requiredHeroIds[0]}`);
    throw new Error('English champion summary is empty');
  }
  const ids = new Set<number>();
  const slugs = new Set<string>();
  const entries = records.map((record) => {
    if (ids.has(record.id)) throw new Error(`Duplicate English champion ID: ${record.id}`);
    ids.add(record.id);
    const slug = championSlug(record.name);
    if (slugs.has(slug)) throw new Error(`Duplicate champion slug: ${slug}`);
    slugs.add(slug);
    return { id: String(record.id), name: record.name, slug };
  });
  for (const id of requiredHeroIds) {
    if (!/^\d+$/.test(id) || !entries.some((entry) => entry.id === id)) {
      throw new Error(`Unknown required champion ID: ${id}`);
    }
  }
  return entries;
}

export async function fetchChampionIndex(fetcher: FetchLike, requiredHeroIds: readonly string[] = []): Promise<ChampionIndexEntry[]> {
  const response = await fetcher(COMMUNITYDRAGON_CHAMPION_SUMMARY_URLS.en, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`CommunityDragon champion summary request failed: ${response.status}`);
  return buildChampionIndex(await response.json(), requiredHeroIds);
}

const requiredCatalogHeroIds = [...new Set(catalog.map((chroma) => chroma.heroId))];
let indexPromise: Promise<ChampionIndexEntry[]> | undefined;

/** Fetches the English summary once per static build and validates catalog coverage. */
export async function getChampionIndex(requiredHeroIds: readonly string[] = requiredCatalogHeroIds): Promise<ChampionIndexEntry[]> {
  indexPromise ??= getCommunityDragonPbeGraph().then((graph) => graph.champions.map((champion) => ({ id: String(champion.id), name: champion.nameEn, slug: champion.slug })));
  const entries = await indexPromise;
  for (const id of requiredHeroIds) {
    if (!entries.some((entry) => entry.id === id)) throw new Error(`Unknown required champion ID: ${id}`);
  }
  return entries;
}
