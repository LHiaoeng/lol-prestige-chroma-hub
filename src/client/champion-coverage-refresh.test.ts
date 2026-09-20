import { expect, it, vi } from 'vitest';
import type { ChampionCoverageSnapshot } from '../domain/champion-coverage';
import { createCommunityDragonRuntime } from './communitydragon-runtime';
import { loadChampionCoverage, refreshChampionCoverage } from './champion-coverage-refresh';

const snapshot: ChampionCoverageSnapshot = {
  patchVersion: '26.14',
  totalChampions: 1,
  coveredChampions: 0,
  missingChampions: 1,
  coveragePercent: 0,
  champions: [],
};

it.each([
  ['default', 'Annie', 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-summary.json'],
  ['zh_cn', '安妮', 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/zh_cn/v1/champion-summary.json'],
] as const)('refreshes only the current %s region through the runtime list seam', async (locale, name, expectedUrl) => {
  const fetcher = vi.fn(async () => new Response(JSON.stringify([
    {
      id: 1,
      name: 'Annie',
      title: locale === 'zh_cn' ? '安妮' : 'the Dark Child',
      alias: 'Annie',
      squarePortraitPath: '/lol-game-data/assets/v1/champion-icons/1.png',
    },
  ]), { status: 200 }));
  const runtime = createCommunityDragonRuntime(fetcher);

  const result = await loadChampionCoverage(runtime, locale, [], '26.14');

  expect(fetcher).toHaveBeenCalledOnce();
  expect(fetcher).toHaveBeenCalledWith(expectedUrl, expect.any(Object));
  expect(result.champions[0]).toMatchObject(
    locale === 'zh_cn' ? { nameZh: name } : { nameEn: name },
  );
});

it('applies a successful refresh exactly once', async () => {
  const apply = vi.fn();
  await expect(refreshChampionCoverage({ load: async () => snapshot, apply })).resolves.toBe(true);
  expect(apply).toHaveBeenCalledWith(snapshot);
});

it('preserves the snapshot when loading fails', async () => {
  const apply = vi.fn();
  const fallback = vi.fn();
  await expect(refreshChampionCoverage({
    load: async () => { throw new Error('offline'); },
    apply,
    fallback,
  })).resolves.toBe(false);
  expect(apply).not.toHaveBeenCalled();
  expect(fallback).toHaveBeenCalledOnce();
});
