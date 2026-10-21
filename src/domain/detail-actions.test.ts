import { describe, expect, it } from 'vitest';
import {
  buguoguoModelUrl,
  googleSearchUrl,
  khadaChampionUrl,
  khadaModelUrl,
  leagueWikiChampionUrl,
  qqHeroBattleDataUrl,
  runtimeSkinActions,
  skinSpotlightsSearchUrl,
} from './detail-actions';

describe('detail action URLs', () => {
  it('builds a Buguoguo chroma model URL from skin and chroma IDs', () => {
    expect(buguoguoModelUrl(84103, 84106)).toBe(
      'https://3d.buguoguo.cn/model-viewer?id=84103&chroma=84106',
    );
  });
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

  it('builds an English League Wiki champion URL from the champion alias', () => {
    expect(leagueWikiChampionUrl('Aurora')).toBe(
      'https://wiki.leagueoflegends.com/en-us/Aurora',
    );
    expect(leagueWikiChampionUrl('Aurelion Sol')).toBe(
      'https://wiki.leagueoflegends.com/en-us/Aurelion_Sol',
    );
  });

  it('builds the Tencent battle data URL from the champion ID', () => {
    expect(qqHeroBattleDataUrl(84)).toBe(
      'https://101.qq.com/#/hero-detail?heroId=84',
    );
  });

  it('prefixes a Google skin search with LEAGUE OF LEGENDS', () => {
    expect(googleSearchUrl('Panda Pal Lux (Obsidian)')).toBe(
      'https://www.google.com/search?q=LEAGUE+OF+LEGENDS+Panda+Pal+Lux+%28Obsidian%29',
    );
  });

  it('builds English skin actions from the verified parent identity', () => {
    expect(runtimeSkinActions('default', {
      id: 103001,
      championId: 103,
      championAlias: 'Ahri',
      name: 'Dynasty Ahri',
    })).toEqual([
      {
        id: 'skinspotlights',
        label: 'Watch on SkinSpotlights',
        href: 'https://www.youtube.com/c/SkinSpotlights/search?query=Dynasty+Ahri',
      },
      {
        id: 'khada-model',
        label: 'View 3D model on KHADA',
        href: 'https://modelviewer.lol/model-viewer?id=103001&lang=en-US',
      },
      {
        id: 'wikipedia',
        label: 'Wiki',
        href: 'https://wiki.leagueoflegends.com/en-us/Ahri',
      },
    ]);
  });

  it('builds Chinese skin actions and encodes the localized name', () => {
    expect(runtimeSkinActions('zh_cn', {
      id: 103001,
      championId: 103,
      championAlias: 'Ahri',
      name: '星之守护者 阿狸 &',
    })).toEqual([
      {
        id: 'voice',
        label: '去语音站收听英雄语音',
        href: 'https://voice.buguoguo.cn/#/voice/103',
      },
      {
        id: 'bilibili',
        label: '去哔哩哔哩看皮肤演示',
        href: 'https://space.bilibili.com/9385598/search/video?keyword=%E6%98%9F%E4%B9%8B%E5%AE%88%E6%8A%A4%E8%80%85+%E9%98%BF%E7%8B%B8+%26',
      },
      {
        id: 'buguoguo-model',
        label: '去卡达查看3D模型',
        href: 'https://3d.buguoguo.cn/model-viewer?id=103001',
      },
      {
        id: 'battle-data',
        label: '对战数据',
        href: 'https://101.qq.com/#/hero-detail?heroId=103',
      },
      {
        id: 'wikipedia',
        label: '维基百科',
        href: 'https://wiki.leagueoflegends.com/en-us/Ahri',
      },
    ]);
  });

  it('uses the selected stage ID for model actions', () => {
    expect(runtimeSkinActions('default', {
      id: 103001,
      stageId: 103002,
      championId: 103,
    }).find((action) => action.id === 'khada-model')?.href).toBe(
      'https://modelviewer.lol/model-viewer?id=103002&lang=en-US',
    );
    expect(runtimeSkinActions('zh_cn', {
      id: 103001,
      stageId: 103002,
      championId: 103,
    }).find((action) => action.id === 'buguoguo-model')?.href).toBe(
      'https://3d.buguoguo.cn/model-viewer?id=103002',
    );
  });
});
