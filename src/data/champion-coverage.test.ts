import { describe, expect, it, vi } from 'vitest';
import { COMMUNITYDRAGON_CHAMPION_SUMMARY_URLS } from '../domain/communitydragon-url';
import { fetchChampionCoverage } from './champion-coverage';

describe('CommunityDragon champion coverage fetch', () => {
  it('requests both localized summaries and returns one snapshot', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([
        { id: 1, name: 'Annie', description: 'the Dark Child', alias: 'Annie', squarePortraitPath: '/lol-game-data/assets/v1/champion-icons/1.png' },
      ]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([
        { id: 1, name: '黑暗之女', description: '安妮', alias: 'Annie', squarePortraitPath: '/lol-game-data/assets/v1/champion-icons/1.png' },
      ]), { status: 200 }));

    await expect(fetchChampionCoverage(fetcher, [], '26.14')).resolves.toMatchObject({
      totalChampions: 1,
      missingChampions: 1,
    });
    expect(fetcher).toHaveBeenNthCalledWith(1, COMMUNITYDRAGON_CHAMPION_SUMMARY_URLS.en, expect.any(Object));
    expect(fetcher).toHaveBeenNthCalledWith(2, COMMUNITYDRAGON_CHAMPION_SUMMARY_URLS.zh, expect.any(Object));
  });

  it('rejects a non-successful response', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('', { status: 503 }));
    await expect(fetchChampionCoverage(fetcher, [], '26.14')).rejects.toThrow(/503/);
  });
});
