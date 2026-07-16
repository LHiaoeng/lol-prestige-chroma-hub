import { describe, expect, it } from 'vitest';
import { selectFeaturedChroma } from './featured-chroma';

describe('featured chroma selection', () => {
  it('selects the first new chroma', () => {
    const catalog = [
      { id: 1, isNew: false },
      { id: 2, isNew: true },
      { id: 3, isNew: true },
    ];
    expect(selectFeaturedChroma(catalog)).toBe(catalog[1]);
  });

  it('falls back to the first chroma', () => {
    const catalog = [{ id: 1, isNew: false }, { id: 2, isNew: false }];
    expect(selectFeaturedChroma(catalog)).toBe(catalog[0]);
  });

  it('returns undefined for an empty catalog', () => {
    expect(selectFeaturedChroma([])).toBeUndefined();
  });
});
