import { describe, expect, it } from 'vitest';
import { buildCatalogQuery, parseSearchParams } from './query';

describe('search query', () => {
  it('uses safe defaults and a release-bound deterministic order', () => {
    const input = parseSearchParams(new URLSearchParams());
    expect(input).toMatchObject({ page: 1, pageSize: 24, sort: 'rank_desc' });
    const query = buildCatalogQuery(input, 'release-1');
    expect(query.sql).toContain('release_id = ?');
    expect(query.sql).toContain('ORDER BY rank DESC, skin_id DESC');
    expect(query.params).toEqual(['release-1', 24, 0]);
  });

  it('builds allow-listed filters with bound values', () => {
    const input = parseSearchParams(new URLSearchParams({
      q: 'senna', hero: 'senna', version: '26.13', category: 'prestige', isNew: 'true',
      sort: 'skin_asc', page: '2', pageSize: '48',
    }));
    const query = buildCatalogQuery(input, 'r2');
    expect(query.sql).toContain('LIKE ?');
    expect(query.sql).toContain('ORDER BY skin_id ASC');
    expect(query.params).toEqual(['r2', '%senna%', '%senna%', 'senna', '26.13', 'prestige', 1, 48, 48]);
  });

  it('sorts dotted game versions numerically', () => {
    const query = buildCatalogQuery(parseSearchParams(new URLSearchParams({ sort: 'version_desc' })), 'r');
    expect(query.sql).toContain("CAST(substr(game_ver");
  });

  it.each([
    ['pageSize=49', /pageSize/i],
    ['page=0', /page/i],
    ['sort=drop_table', /sort/i],
    [`q=${'x'.repeat(65)}`, /q/i],
    ['isNew=yes', /isNew/i],
    ['version=latest', /version/i],
  ])('rejects invalid parameters: %s', (query, message) => {
    expect(() => parseSearchParams(new URLSearchParams(query))).toThrow(message);
  });
});
