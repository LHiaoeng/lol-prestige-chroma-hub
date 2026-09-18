import { communityDragonDataUrl, communityDragonChampionUrl } from '../domain/communitydragon-url';
import { buildPbeGraph, type PbeGraph, type PbeRawSnapshot } from '../domain/communitydragon-content';
import type { FetchLike } from './champion-coverage';

async function readJson(fetcher: FetchLike, url: string, required = true): Promise<unknown | undefined> {
  const response = await fetcher(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) {
    if (!required && response.status === 404) return undefined;
    throw new Error(`CommunityDragon PBE request failed (${url}): ${response.status}`);
  }
  return response.json();
}

async function mapWithConcurrency<T, R>(items: readonly T[], limit: number, task: (item: T) => Promise<R>): Promise<R[]> {
  const result: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      result[index] = await task(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return result;
}

export async function fetchCommunityDragonPbeGraph(fetcher: FetchLike = fetch): Promise<PbeGraph> {
  const defaultSummary = await readJson(fetcher, communityDragonDataUrl('champion-summary.json', 'default'));
  const summary = Array.isArray(defaultSummary) ? defaultSummary : [];
  const [zhSummary, defaultSkins, zhSkins, defaultSkinlines, zhSkinlines, defaultUniverses, zhUniverses] = await Promise.all([
    readJson(fetcher, communityDragonDataUrl('champion-summary.json', 'zh_cn'), false),
    readJson(fetcher, communityDragonDataUrl('skins.json', 'default')),
    readJson(fetcher, communityDragonDataUrl('skins.json', 'zh_cn'), false),
    readJson(fetcher, communityDragonDataUrl('skinlines.json', 'default')),
    readJson(fetcher, communityDragonDataUrl('skinlines.json', 'zh_cn'), false),
    readJson(fetcher, communityDragonDataUrl('universes.json', 'default')),
    readJson(fetcher, communityDragonDataUrl('universes.json', 'zh_cn'), false),
  ]);
  const ids = summary.filter((entry: any) => Number(entry?.id) > 0).map((entry: any) => Number(entry.id));
  const championDetails = await mapWithConcurrency(ids, 10, async (id) => ({
    id,
    default: await readJson(fetcher, communityDragonChampionUrl(String(id), 'en')),
    zh: await readJson(fetcher, communityDragonChampionUrl(String(id), 'zh'), false),
  }));
  const snapshot: PbeRawSnapshot = { defaultSummary, zhSummary, defaultSkins, zhSkins, defaultSkinlines, zhSkinlines, defaultUniverses, zhUniverses, championDetails };
  return buildPbeGraph(snapshot);
}

let graphPromise: Promise<PbeGraph> | undefined;
export function getCommunityDragonPbeGraph(): Promise<PbeGraph> {
  graphPromise ??= fetchCommunityDragonPbeGraph();
  return graphPromise;
}

export function resetCommunityDragonPbeGraphForTests(): void {
  graphPromise = undefined;
}
