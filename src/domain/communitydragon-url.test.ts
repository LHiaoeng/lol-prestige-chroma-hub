import { describe, expect, it } from 'vitest';
import {
  COMMUNITYDRAGON_CHAMPION_SUMMARY_URLS,
  communityDragonAssetUrl,
  communityDragonChampionUrl,
} from './communitydragon-url';

describe('CommunityDragon URL conversion', () => {
  it('converts game asset and plugin paths to normalized pbe URLs', () => {
    expect(communityDragonAssetUrl('/lol-game-data/assets/ASSETS/Characters/Annie/Icon.PNG')).toBe(
      'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/assets/characters/annie/icon.png',
    );
    expect(communityDragonAssetUrl('plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/1.png')).toBe(
      'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/1.png',
    );
  });

  it('normalizes recognized full raw URLs through the same converter', () => {
    expect(communityDragonAssetUrl('https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/1.png')).toBe(
      'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/1.png',
    );
  });

  it('keeps game paths and normalizes bare ASSETS paths', () => {
    expect(communityDragonAssetUrl('game/assets/characters/ahri/icon.png')).toBe(
      'https://raw.communitydragon.org/pbe/game/assets/characters/ahri/icon.png',
    );
    expect(communityDragonAssetUrl('ASSETS/Characters/Ahri/Icon.PNG')).toBe(
      'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/assets/characters/ahri/icon.png',
    );
  });

  it.each(['', '   ', '../secret.png', 'assets/../secret.png', String.raw`assets\icon.png`, 'https://example.com/icon.png'])(
    'rejects unsafe asset input %j',
    (input) => expect(() => communityDragonAssetUrl(input)).toThrow(),
  );

  it('defines the approved bilingual summary endpoints', () => {
    expect(COMMUNITYDRAGON_CHAMPION_SUMMARY_URLS).toEqual({
      en: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-summary.json',
      zh: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/zh_cn/v1/champion-summary.json',
    });
  });

  it('builds bilingual champion detail endpoints from a positive champion ID', () => {
    expect(communityDragonChampionUrl('103', 'en')).toBe(
      'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champions/103.json',
    );
    expect(communityDragonChampionUrl('103', 'zh')).toBe(
      'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/zh_cn/v1/champions/103.json',
    );
  });

  it.each(['', '0', '-1', '1.5', 'abc', '9007199254740992'])(
    'rejects invalid champion ID %j',
    (input) => expect(() => communityDragonChampionUrl(input, 'en')).toThrow(/champion ID/),
  );
});
