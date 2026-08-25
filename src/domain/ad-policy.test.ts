import { describe, expect, it } from 'vitest';
import { canDisplayAds } from './ad-policy';

describe('advertising page policy', () => {
  it('allows the catalog index', () => {
    expect(canDisplayAds('catalog-index')).toBe(true);
  });

  it('allows only explicitly eligible editorial articles', () => {
    expect(canDisplayAds('editorial-article', true)).toBe(true);
    expect(canDisplayAds('editorial-article', false)).toBe(false);
  });
});
