import { describe, expect, it } from 'vitest';
import { googleSearchUrl, khadaChampionUrl, khadaModelUrl, skinSpotlightsSearchUrl } from './detail-actions';

describe('detail action URLs', () => {
  it('searches SkinSpotlights with only the skin name', () => {
    expect(skinSpotlightsSearchUrl('Panda Pal Lux (Obsidian)')).toBe(
      'https://www.youtube.com/c/SkinSpotlights/search?query=Panda+Pal+Lux+%28Obsidian%29',
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

  it('builds a KHADA champion model URL from the catalog string ID', () => {
    expect(khadaChampionUrl('876')).toBe(
      'https://modelviewer.lol/model-viewer?id=876000',
    );
  });

  it('prefixes a Google skin search with LEAGUE OF LEGENDS', () => {
    expect(googleSearchUrl('Panda Pal Lux (Obsidian)')).toBe(
      'https://www.google.com/search?q=LEAGUE+OF+LEGENDS+Panda+Pal+Lux+%28Obsidian%29',
    );
  });
});
