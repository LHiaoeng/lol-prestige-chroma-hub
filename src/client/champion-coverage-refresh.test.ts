import { expect, it, vi } from 'vitest';
import type { ChampionCoverageSnapshot } from '../domain/champion-coverage';
import { refreshChampionCoverage } from './champion-coverage-refresh';

const snapshot: ChampionCoverageSnapshot = {
  patchVersion: '26.14',
  totalChampions: 1,
  coveredChampions: 0,
  missingChampions: 1,
  coveragePercent: 0,
  champions: [],
};

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
