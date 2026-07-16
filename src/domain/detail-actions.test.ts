import { describe, expect, it } from 'vitest';
import { googleSearchUrl, khadaModelUrl, skinSpotlightsSearchUrl } from './detail-actions';

describe('detail action URLs', () => {
  it('encodes a SkinSpotlights keyword', () => {
    expect(skinSpotlightsSearchUrl('Gwen Soul Fighter')).toBe(
      'https://www.youtube.com/c/SkinSpotlights/search?query=Gwen+Soul+Fighter',
    );
  });

  it('builds a KHADA base skin model URL', () => {
    expect(khadaModelUrl(99072)).toBe(
      'https://modelviewer.lol/model-viewer?id=99072&lang=en-US',
    );
  });

  it('builds a KHADA prestige chroma model URL from base and chroma IDs', () => {
    expect(khadaModelUrl(99072, 99080)).toBe(
      'https://modelviewer.lol/model-viewer?id=99072&lang=en-US&chroma=99080',
    );
  });

  it('encodes a Google keyword', () => {
    expect(googleSearchUrl('Gwen Soul Fighter')).toBe(
      'https://www.google.com/search?q=Gwen+Soul+Fighter',
    );
  });
});
