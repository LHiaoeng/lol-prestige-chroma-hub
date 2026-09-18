import { describe, expect, it } from 'vitest';
import { buildChampionDetail } from './champion-detail';

function champion(id: number, name: string, title: string) {
  return {
    id,
    name,
    title,
    shortBio: `${name} biography`,
    squarePortraitPath: `/lol-game-data/assets/v1/champion-icons/${id}.png`,
    skins: [{ id: id * 1000, name, isBase: true, splashPath: `/lol-game-data/assets/ASSETS/Characters/${name}/Skins/Base/${name}_Splash.jpg` }],
  };
}

describe('CommunityDragon champion detail', () => {
  it('merges localized records and converts image paths supplied by JSON', () => {
    const detail = buildChampionDetail(champion(103, 'Ahri', 'the Nine-Tailed Fox'), champion(103, '九尾妖狐', '阿狸'), '103');
    expect(detail).toMatchObject({
      id: '103',
      slug: 'ahri',
      en: { name: 'Ahri', title: 'the Nine-Tailed Fox' },
      zh: { name: '阿狸', title: '九尾妖狐' },
    });
    expect(detail.portraitUrl).toBe('https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/103.png');
    expect(detail.splashUrl).toContain('/assets/characters/ahri/skins/base/ahri_splash.jpg');
    expect(detail.skins).toEqual([expect.objectContaining({ id: 103000, nameEn: 'Ahri', nameZh: '九尾妖狐', isBase: true })]);
  });

  it('matches skins by ID even when localized payloads use different ordering', () => {
    const english = champion(103, 'Ahri', 'the Nine-Tailed Fox');
    english.skins.push({ id: 103001, name: 'Dynasty Ahri', isBase: false, splashPath: '/lol-game-data/assets/ASSETS/Characters/Ahri/Skins/Skin01/ahri_splash.jpg' });
    const chinese = champion(103, '九尾妖狐', '阿狸');
    chinese.skins.unshift({ id: 103001, name: '玉狐', isBase: false, splashPath: '/lol-game-data/assets/ASSETS/Characters/Ahri/Skins/Skin01/ahri_splash_zh.jpg' });
    const detail = buildChampionDetail(english, chinese, '103');
    expect(detail.skins[1]).toMatchObject({ id: 103001, nameEn: 'Dynasty Ahri', nameZh: '玉狐', isBase: false });
    expect(detail.skins[1].splashUrl).toContain('/skins/skin01/ahri_splash.jpg');
    expect(detail.skins[1].splashUrlZh).toContain('/skins/skin01/ahri_splash_zh.jpg');
  });

  it('rejects a localized record whose ID does not match the route', () => {
    expect(() => buildChampionDetail(champion(103, 'Ahri', 'title'), champion(1, '安妮', 'title'), '103'))
      .toThrow(/does not match requested ID/);
  });

  it('rejects missing required fields and missing base skins', () => {
    const invalid = { ...champion(103, 'Ahri', 'title'), shortBio: '' };
    expect(() => buildChampionDetail(invalid, champion(103, '阿狸', 'title'), '103')).toThrow();
    const withoutBase = { ...champion(103, 'Ahri', 'title'), skins: [{ id: 103000, name: 'Ahri', isBase: false, splashPath: '/lol-game-data/assets/a.png' }] };
    expect(() => buildChampionDetail(withoutBase, champion(103, '阿狸', 'title'), '103')).toThrow(/no base skin/);
  });
});
