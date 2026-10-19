import { describe, expect, it } from 'vitest';
import { catalog } from '../data/catalog';
import { brilliantSummonSessions } from './brilliant-summon';

describe('Brilliant Prestige Chroma Summoning session data', () => {
  it('keeps every linked reward resolvable in the catalog', () => {
    for (const session of brilliantSummonSessions) {
      expect(session.rewards.length).toBeGreaterThan(0);
      expect(session.rewards[0]).toMatchObject({
        heroId: session.rewardHeroId,
        skinNameEn: session.rewardSkinNameEn,
        chromaNameEn: session.rewardChromaNameEn,
      });
      for (const reward of session.rewards) {
        expect(catalog.some((chroma) => chroma.heroId === reward.heroId && chroma.skinNameEn === reward.skinNameEn && chroma.nameEn === reward.chromaNameEn)).toBe(true);
      }
    }
  });

  it('retains the published 202620 price curve and total', () => {
    const session = brilliantSummonSessions.find((entry) => entry.sessionId === '202620');
    expect(session?.drawCosts).toEqual([1200, 1800, 2400, 3000, 3600, 4200, 4800, 6000, 12000, 18000]);
    expect(session?.drawCosts?.reduce((sum, cost) => sum + cost, 0)).toBe(57000);
  });

  it('retains the published 202622 event window, price curve and total', () => {
    const session = brilliantSummonSessions.find((entry) => entry.sessionId === '202622');
    expect(session?.eventUrl).toBe('https://lol.qq.com/act/a202610168353tendraws37/index.html');
    expect(session?.windowStart).toBe('2026-10-16');
    expect(session?.windowEnd).toBe('2026-11-15');
    expect(session?.drawCosts).toEqual([1200, 1800, 2400, 3000, 3600, 4200, 4800, 6000, 12000, 18000]);
    expect(session?.drawCosts?.reduce((sum, cost) => sum + cost, 0)).toBe(57000);
  });
});
