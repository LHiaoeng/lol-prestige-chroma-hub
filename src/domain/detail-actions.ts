import type { CommunityDragonLocale } from './communitydragon-runtime';

function searchUrl(base: string, parameter: string, keyword: string): string {
  const url = new URL(base);
  url.searchParams.set(parameter, keyword);
  return url.toString();
}

export interface RuntimeSkinAction {
  readonly id: 'skinspotlights' | 'khada-model' | 'voice' | 'bilibili' | 'buguoguo-model' | 'wikipedia' | 'battle-data';
  readonly label: string;
  readonly href: string;
}

export interface RuntimeSkinActionInput {
  readonly id: number;
  readonly stageId?: number;
  readonly championId: number;
  readonly championAlias?: string;
  readonly name?: string;
}

export function buguoguoModelUrl(id: number, chromaId?: number): string {
  const url = new URL('https://3d.buguoguo.cn/model-viewer');
  url.searchParams.set('id', String(id));
  if (chromaId !== undefined) url.searchParams.set('chroma', String(chromaId));
  return url.toString();
}

export function buguoguoVoiceUrl(championId: number): string {
  return `https://voice.buguoguo.cn/#/voice/${championId}`;
}

export function leagueWikiChampionUrl(championAlias: string): string {
  const page = championAlias.trim().replace(/\s+/g, '_');
  return `https://wiki.leagueoflegends.com/en-us/${encodeURIComponent(page)}`;
}

export function qqHeroBattleDataUrl(championId: number): string {
  return `https://101.qq.com/#/hero-detail?heroId=${championId}`;
}

/** Build only the reference project's external actions for the active locale. */
export function runtimeSkinActions(
  locale: CommunityDragonLocale,
  input: RuntimeSkinActionInput,
): readonly RuntimeSkinAction[] {
  if (locale === 'default') {
    const actions: RuntimeSkinAction[] = [];
    if (input.name) {
      actions.push({
        id: 'skinspotlights',
        label: 'Watch on SkinSpotlights',
        href: skinSpotlightsSearchUrl(input.name),
      });
    }
    actions.push({
      id: 'khada-model',
      label: 'View 3D model on KHADA',
      href: khadaModelUrl(input.stageId ?? input.id),
    });
    if (input.championAlias) {
      actions.push({
        id: 'wikipedia',
        label: 'Wiki',
        href: leagueWikiChampionUrl(input.championAlias),
      });
    }
    return actions;
  }

  const actions: RuntimeSkinAction[] = [
    {
      id: 'voice',
      label: '去语音站收听英雄语音',
      href: buguoguoVoiceUrl(input.championId),
    },
  ];
  if (input.name) {
    actions.push({
      id: 'bilibili',
      label: '去哔哩哔哩看皮肤演示',
      href: searchUrl(
        'https://space.bilibili.com/9385598/search/video',
        'keyword',
        input.name,
      ),
    });
  }
  actions.push({
    id: 'buguoguo-model',
    label: '去卡达查看3D模型',
    href: buguoguoModelUrl(input.stageId ?? input.id),
  });
  actions.push({
    id: 'battle-data',
    label: '对战数据',
    href: qqHeroBattleDataUrl(input.championId),
  });
  if (input.championAlias) {
    actions.push({
      id: 'wikipedia',
      label: '维基百科',
      href: leagueWikiChampionUrl(input.championAlias),
    });
  }
  return actions;
}

export function skinSpotlightsSearchUrl(keyword: string): string {
  return searchUrl('https://www.youtube.com/c/SkinSpotlights/search', 'query', keyword);
}

export function khadaModelUrl(skinId: number, chromaId?: number): string {
  const url = new URL('https://modelviewer.lol/model-viewer');
  url.searchParams.set('id', String(skinId));
  url.searchParams.set('lang', 'en-US');
  if (chromaId !== undefined) url.searchParams.set('chroma', String(chromaId));
  return url.toString();
}

export function khadaChampionUrl(championId: string): string {
  const url = new URL('https://modelviewer.lol/model-viewer');
  // Temporary fallback until the source provides each champion's base skin ID.
  url.searchParams.set('id', String(Number(championId) * 1000));
  return url.toString();
}

export function googleSearchUrl(keyword: string): string {
  return searchUrl('https://www.google.com/search', 'q', `LEAGUE OF LEGENDS ${keyword}`);
}

export function patchNotesUrl(gameVersion: string): string {
  return `https://www.leagueoflegends.com/en-us/news/game-updates/league-of-legends-patch-${gameVersion.replaceAll('.', '-')}-notes/`;
}
