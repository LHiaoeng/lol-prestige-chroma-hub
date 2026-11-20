import { describe, expect, it } from 'vitest';
import { selectFeaturedChroma, selectNewChromas } from './featured-chroma';

describe('homepage new chromas', () => {
  it('keeps every new entry in source order beyond a single batch', () => {
    const newEntries = Array.from({ length: 27 }, (_, id) => ({ id, isNew: true }));
    const entries = [{ id: 99, isNew: false }, ...newEntries, { id: 100, isNew: false }];
    expect(selectNewChromas(entries)).toEqual(newEntries);
  });

  it('returns an empty list when there are no new entries', () => {
    expect(selectNewChromas([{ id: 99, isNew: false }])).toEqual([]);
    expect(selectNewChromas([])).toEqual([]);
  });
});

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
