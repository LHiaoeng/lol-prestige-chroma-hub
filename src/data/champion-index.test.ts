import { describe, expect, it, vi } from 'vitest';
import { COMMUNITYDRAGON_CHAMPION_SUMMARY_URLS } from '../domain/communitydragon-url';
import { buildChampionIndex, fetchChampionIndex } from './champion-index';

const summary = [
  { id: 36, name: 'Dr. Mundo' },
  { id: 103, name: 'Ahri' },
  { id: 166, name: 'Akshan' },
  { id: 147, name: "Kai'Sa" },
  { id: 999, name: 'Renata Glasc' },
];

describe('champion index', () => {
  it('maps summary names to route-safe slugs', () => {
    expect(buildChampionIndex(summary, ['103', '36'])).toEqual([
      { id: '36', name: 'Dr. Mundo', slug: 'dr-mundo' },
      { id: '103', name: 'Ahri', slug: 'ahri' },
    ]);
  });

  it('fetches only the English summary and validates required IDs', async () => {
    const fetcher = vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify(summary), { status: 200 })));
    await expect(fetchChampionIndex(fetcher, ['103'])).resolves.toEqual([{ id: '103', name: 'Ahri', slug: 'ahri' }]);
    expect(fetcher).toHaveBeenCalledWith(COMMUNITYDRAGON_CHAMPION_SUMMARY_URLS.en, expect.any(Object));
    await expect(fetchChampionIndex(fetcher, ['1'])).rejects.toThrow(/Unknown required champion ID/);
  });

  it('rejects duplicate IDs, slugs, and unsuccessful responses', async () => {
    expect(() => buildChampionIndex([{ id: 1, name: 'A' }, { id: 1, name: 'B' }])).toThrow(/Duplicate English champion ID/);
    expect(() => buildChampionIndex([{ id: 1, name: "Kai'Sa" }, { id: 2, name: 'Kai-Sa' }])).toThrow(/Duplicate champion slug/);
    const fetcher = vi.fn().mockResolvedValue(new Response('', { status: 503 }));
    await expect(fetchChampionIndex(fetcher)).rejects.toThrow(/503/);
  });
});
