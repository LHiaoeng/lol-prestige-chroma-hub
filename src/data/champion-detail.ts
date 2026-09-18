import { buildChampionDetail, type ChampionDetail } from '../domain/champion-detail';
import { communityDragonChampionUrl } from '../domain/communitydragon-url';
import type { FetchLike } from './champion-coverage';

export async function fetchChampionDetail(fetcher: FetchLike, championId: string): Promise<ChampionDetail> {
  const urls = [communityDragonChampionUrl(championId, 'en'), communityDragonChampionUrl(championId, 'zh')];
  const responses = await Promise.all(urls.map((url) => fetcher(url, { signal: AbortSignal.timeout(15_000) })));
  for (const [index, response] of responses.entries()) {
    if (!response.ok) throw new Error(`CommunityDragon champion request failed (${urls[index]}): ${response.status}`);
  }
  const [english, chinese] = await Promise.all(responses.map((response) => response.json()));
  return buildChampionDetail(english, chinese, championId);
}

const detailCache = new Map<string, Promise<ChampionDetail>>();
const MAX_CONCURRENT_REQUESTS = 8;
let activeRequests = 0;
const waiting: Array<() => void> = [];

async function withRequestSlot<T>(task: () => Promise<T>): Promise<T> {
  if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
    await new Promise<void>((resolve) => waiting.push(resolve));
  }
  activeRequests += 1;
  try {
    return await task();
  } finally {
    activeRequests -= 1;
    waiting.shift()?.();
  }
}

export function getChampionDetail(championId: string): Promise<ChampionDetail> {
  const cached = detailCache.get(championId);
  if (cached) return cached;
  const request = withRequestSlot(() => fetchChampionDetail(fetch, championId));
  detailCache.set(championId, request);
  return request;
}
