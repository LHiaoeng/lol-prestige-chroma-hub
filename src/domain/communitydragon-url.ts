const RAW_ORIGIN = 'https://raw.communitydragon.org';
const ASSET_PREFIX = '/lol-game-data/assets';
const PLUGIN_PREFIX = 'plugins/';
const DEFAULT_GAME_DATA_PREFIX = 'plugins/rcp-be-lol-game-data/global/default';

export const COMMUNITYDRAGON_CHAMPION_SUMMARY_URLS = {
  en: `${RAW_ORIGIN}/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-summary.json`,
  zh: `${RAW_ORIGIN}/latest/plugins/rcp-be-lol-game-data/global/zh_cn/v1/champion-summary.json`,
} as const;

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
    path = url.pathname.replace(/^\/(?:latest|pbe)\//i, '');
  }

  path = path.toLowerCase();
  if (path.startsWith(ASSET_PREFIX)) {
    return `${DEFAULT_GAME_DATA_PREFIX}${path.slice(ASSET_PREFIX.length)}`;
  }
  if (path.startsWith(PLUGIN_PREFIX)) return path;
  throw new Error('Unsupported CommunityDragon asset path');
}

export function communityDragonAssetUrl(assetPath: string): string {
  return `${RAW_ORIGIN}/latest/${relativeCommunityDragonPath(assetPath)}`;
}
