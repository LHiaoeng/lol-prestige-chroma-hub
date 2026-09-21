import { describe, expect, it } from 'vitest';
import {
  googleSearchUrl,
  khadaChampionUrl,
  khadaModelUrl,
  runtimeSkinActions,
  skinSpotlightsSearchUrl,
} from './detail-actions';

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

  it('builds only the English skin actions from the verified parent identity', () => {
    expect(runtimeSkinActions('default', {
      id: 103001,
      championId: 103,
      championAlias: 'Ahri',
      name: 'Dynasty Ahri',
    })).toEqual([
      {
        id: 'skinspotlights',
        label: 'SkinSpotlights',
        href: 'https://www.youtube.com/c/SkinSpotlights/search?query=Dynasty+Ahri',
      },
      {
        id: 'teemo',
        label: 'Teemo.GG',
        href: 'https://teemo.gg/model-viewer?game=league-of-legends&type=champions&object=ahri&skinid=ahri-1',
      },
    ]);
  });

  it('builds only the Chinese skin actions and encodes the localized name', () => {
    expect(runtimeSkinActions('zh_cn', {
      id: 103001,
      championId: 103,
      championAlias: 'Ahri',
      name: '星之守护者 阿狸 &',
    })).toEqual([
      {
        id: 'voice',
        label: '布锅锅语音站',
        href: 'https://voice.buguoguo.cn/voice/103',
      },
      {
        id: 'bilibili',
        label: '哔哩哔哩',
        href: 'https://space.bilibili.com/9385598/search/video?keyword=%E6%98%9F%E4%B9%8B%E5%AE%88%E6%8A%A4%E8%80%85+%E9%98%BF%E7%8B%B8+%26',
      },
      {
        id: 'buguoguo-model',
        label: '布锅锅 3D 模型站',
        href: 'https://3d.buguoguo.cn/model-viewer?id=103001',
      },
    ]);
  });

  it('uses the parent skin ID when actions are generated for a stage', () => {
    expect(runtimeSkinActions('default', {
      id: 103001,
      stageId: 103002,
      championId: 103,
      championAlias: 'Ahri',
      name: 'Dynasty Ahri · Ascended',
    })[1]?.href).toContain('skinid=ahri-1');
  });
});
