import { describe, expect, it } from 'vitest';
import { googleSearchUrl, khadaModelUrl, skinSpotlightsSearchUrl } from './detail-actions';

describe('detail action URLs', () => {
  it('encodes a SkinSpotlights keyword', () => {
    expect(skinSpotlightsSearchUrl('Gwen Soul Fighter')).toBe(
      'https://www.youtube.com/c/SkinSpotlights/search?query=Gwen+Soul+Fighter',
    );
  });

  it('builds a KHADA model URL from the requested skin ID', () => {
    expect(khadaModelUrl(99080)).toBe(
      'https://modelviewer.lol/model-viewer?id=99080&lang=en-US',
    );
  });

  it('encodes a Google keyword', () => {
    expect(googleSearchUrl('Gwen Soul Fighter')).toBe(
      'https://www.google.com/search?q=Gwen+Soul+Fighter',
    );
  });
});
