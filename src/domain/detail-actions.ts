import type { CommunityDragonLocale } from './communitydragon-runtime';

function searchUrl(base: string, parameter: string, keyword: string): string {
  const url = new URL(base);
  url.searchParams.set(parameter, keyword);
  return url.toString();
}

export interface RuntimeSkinAction {
  readonly id: 'skinspotlights' | 'teemo' | 'voice' | 'bilibili' | 'buguoguo-model';
  readonly label: string;
  readonly href: string;
}

export interface RuntimeSkinActionInput {
  readonly id: number;
  /** The parent skin ID remains the URL identity when the view is a stage. */
  readonly stageId?: number;
  readonly championId: number;
  readonly championAlias?: string;
  readonly name?: string;
}

function teemoSkinModelUrl(input: RuntimeSkinActionInput): string | undefined {
  if (!input.championAlias) return undefined;
  const alias = input.championAlias.toLowerCase();
  const url = new URL('https://teemo.gg/model-viewer');
  url.searchParams.set('game', 'league-of-legends');
  url.searchParams.set('type', 'champions');
  url.searchParams.set('object', alias);
  url.searchParams.set('skinid', `${alias}-${input.id % 1000}`);
  return url.toString();
}

function buguoguoModelUrl(input: RuntimeSkinActionInput): string {
  const url = new URL('https://3d.buguoguo.cn/model-viewer');
  url.searchParams.set('id', String(input.id));
  return url.toString();
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
        label: 'SkinSpotlights',
        href: skinSpotlightsSearchUrl(input.name),
      });
    }
    const teemoUrl = teemoSkinModelUrl(input);
    if (teemoUrl) actions.push({ id: 'teemo', label: 'Teemo.GG', href: teemoUrl });
    return actions;
  }

  const actions: RuntimeSkinAction[] = [
    {
      id: 'voice',
      label: '布锅锅语音站',
      href: `https://voice.buguoguo.cn/voice/${input.championId}`,
    },
  ];
  if (input.name) {
    actions.push({
      id: 'bilibili',
      label: '哔哩哔哩',
      href: searchUrl(
        'https://space.bilibili.com/9385598/search/video',
        'keyword',
        input.name,
      ),
    });
  }
  actions.push({
    id: 'buguoguo-model',
    label: '布锅锅 3D 模型站',
    href: buguoguoModelUrl(input),
  });
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
