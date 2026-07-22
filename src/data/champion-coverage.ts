import { buildChampionCoverage, type ChampionCoverageSnapshot } from '../domain/champion-coverage';
import { COMMUNITYDRAGON_CHAMPION_SUMMARY_URLS } from '../domain/communitydragon-url';

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export async function fetchChampionCoverage(
  fetcher: FetchLike,
  coveredHeroIds: readonly string[],
  patchVersion: string,
): Promise<ChampionCoverageSnapshot> {
  const responses = await Promise.all([
    fetcher(COMMUNITYDRAGON_CHAMPION_SUMMARY_URLS.en, { signal: AbortSignal.timeout(10_000) }),
    fetcher(COMMUNITYDRAGON_CHAMPION_SUMMARY_URLS.zh, { signal: AbortSignal.timeout(10_000) }),
  ]);
  for (const response of responses) {
    if (!response.ok) throw new Error(`CommunityDragon request failed: ${response.status}`);
  }
  const [english, chinese] = await Promise.all(responses.map((response) => response.json()));
  return buildChampionCoverage(english, chinese, coveredHeroIds, patchVersion);
}
