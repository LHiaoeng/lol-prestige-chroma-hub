import { describe, expect, it } from 'vitest';
import { HEADER_CONDENSE_THRESHOLD, isHeaderCondensed } from './header-glass';

describe('header glass', () => {
  it('keeps the airy glass state inside the top threshold', () => {
    expect(isHeaderCondensed(0)).toBe(false);
    expect(isHeaderCondensed(HEADER_CONDENSE_THRESHOLD)).toBe(false);
  });

  it('condenses once the page scrolls past the threshold', () => {
    expect(isHeaderCondensed(HEADER_CONDENSE_THRESHOLD + 1)).toBe(true);
    expect(isHeaderCondensed(0, 0)).toBe(false);
    expect(isHeaderCondensed(1, 0)).toBe(true);
  });
});
