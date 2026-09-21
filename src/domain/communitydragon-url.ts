const RAW_ORIGIN = 'https://raw.communitydragon.org';
const ASSET_PREFIX = '/lol-game-data/assets';
const PLUGIN_PREFIX = 'plugins/';
const DEFAULT_GAME_DATA_PREFIX = 'plugins/rcp-be-lol-game-data/global/default';
export const COMMUNITYDRAGON_VERSION = 'pbe';
export const COMMUNITYDRAGON_CHANNELS = ['pbe', 'latest'] as const;
export type CommunityDragonChannel = (typeof COMMUNITYDRAGON_CHANNELS)[number];
export type CommunityDragonLocalizationView = 'default' | 'zh_cn';

export function communityDragonChannelLabel(
  channel: CommunityDragonChannel,
  view: CommunityDragonLocalizationView,
): string {
  if (channel === 'pbe') return 'PBE';
  return view === 'zh_cn' ? '正式服' : 'Live';
}

export function communityDragonDataUrl(
  file: string,
  locale: CommunityDragonLocalizationView = 'default',
  channel: CommunityDragonChannel = COMMUNITYDRAGON_VERSION,
): string {
  const normalized = file.replace(/^\/+/, '');
  if (!normalized || normalized.includes('..') || normalized.includes('\\') || !normalized.endsWith('.json')) {
    throw new Error('Invalid CommunityDragon JSON path');
  }
  return `${RAW_ORIGIN}/${channel}/plugins/rcp-be-lol-game-data/global/${locale}/v1/${normalized}`;
}

export function communityDragonVersionMetadataUrl(
  channel: CommunityDragonChannel = COMMUNITYDRAGON_VERSION,
): string {
  return `${RAW_ORIGIN}/${channel}/compat-version-metadata.json`;
}

export const COMMUNITYDRAGON_CHAMPION_SUMMARY_URLS = {
  en: communityDragonDataUrl('champion-summary.json', 'default'),
  zh: communityDragonDataUrl('champion-summary.json', 'zh_cn'),
} as const;

export type CommunityDragonLanguage = keyof typeof COMMUNITYDRAGON_CHAMPION_SUMMARY_URLS;

function positiveChampionId(input: string): string {
  const championId = input.trim();
  if (!/^[1-9]\d*$/.test(championId) || !Number.isSafeInteger(Number(championId))) {
    throw new Error('Invalid CommunityDragon champion ID');
  }
  return championId;
}

export function communityDragonChampionUrl(
  championId: string,
  language: CommunityDragonLanguage,
  channel: CommunityDragonChannel = COMMUNITYDRAGON_VERSION,
): string {
  const locale = language === 'zh' ? 'zh_cn' : 'default';
  return communityDragonDataUrl(`champions/${positiveChampionId(championId)}.json`, locale, channel);
}

function relativeCommunityDragonPath(input: string): string {
  const trimmed = input.trim();
  if (!trimmed || trimmed.includes('\\') || trimmed.split('/').includes('..')) {
    throw new Error('Invalid CommunityDragon asset path');
  }

  let path = trimmed;
  if (/^https?:\/\//i.test(path)) {
    const url = new URL(path);
    if (url.protocol !== 'https:' || url.origin !== RAW_ORIGIN || url.search || url.hash) {
      throw new Error('Invalid CommunityDragon asset URL');
    }
    path = url.pathname.replace(/^\/(?:latest|pbe|\d+\.\d+)\//i, '');
  }

  path = path.toLowerCase();
  if (path.startsWith('/game/')) return path.slice(1);
  if (path.startsWith('/plugins/')) return path.slice(1);
  if (path.startsWith(ASSET_PREFIX)) {
    return `${DEFAULT_GAME_DATA_PREFIX}${path.slice(ASSET_PREFIX.length)}`;
  }
  if (path.startsWith('assets/')) {
    return `${DEFAULT_GAME_DATA_PREFIX}/${path}`;
  }
  if (path.startsWith(PLUGIN_PREFIX)) return path;
  if (path.startsWith('game/')) return path;
  throw new Error('Unsupported CommunityDragon asset path');
}

export function communityDragonAssetUrl(assetPath: string, channel: CommunityDragonChannel = COMMUNITYDRAGON_VERSION): string {
  return `${RAW_ORIGIN}/${channel}/${relativeCommunityDragonPath(assetPath)}`;
}
