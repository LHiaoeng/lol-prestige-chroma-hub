import { describe, expect, it, vi } from 'vitest';
import { communityDragonChampionUrl } from '../domain/communitydragon-url';
import { fetchChampionDetail } from './champion-detail';

const record = (name: string, title = `${name} title`) => ({
  id: 103,
  name,
  title,
  shortBio: `${name} biography`,
  squarePortraitPath: '/lol-game-data/assets/v1/champion-icons/103.png',
  skins: [{ id: 103000, name, isBase: true, splashPath: '/lol-game-data/assets/ASSETS/Characters/Ahri/Skins/Base/ahri_splash.jpg' }],
});

describe('CommunityDragon champion detail fetch', () => {
  it('requests both supported languages and returns their shared model', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(record('Ahri')), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(record('九尾妖狐', '阿狸')), { status: 200 }));
    await expect(fetchChampionDetail(fetcher, '103')).resolves.toMatchObject({
      id: '103',
      slug: 'ahri',
      en: { name: 'Ahri' },
      zh: { name: '阿狸', title: '九尾妖狐' },
    });
    expect(fetcher).toHaveBeenNthCalledWith(1, communityDragonChampionUrl('103', 'en'), expect.any(Object));
    expect(fetcher).toHaveBeenNthCalledWith(2, communityDragonChampionUrl('103', 'zh'), expect.any(Object));
  });

  it('preserves a non-successful response as a build error', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('', { status: 404 }));
    await expect(fetchChampionDetail(fetcher, '103')).rejects.toThrow(/404/);
  });
});
