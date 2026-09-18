import { describe, expect, it } from 'vitest';
import { buildPbeGraph } from './communitydragon-content';

const snapshot = {
  defaultSummary: [{ id: 103, name: 'Ahri', title: 'The Nine-Tailed Fox', shortBio: 'bio', squarePortraitPath: '/lol-game-data/assets/v1/champion-icons/103.png' }],
  zhSummary: [{ id: 103, name: '九尾妖狐', title: '阿狸', shortBio: '简介' }],
  defaultSkins: { 103000: { id: 103000 } }, zhSkins: { 103000: { id: 103000 } },
  defaultSkinlines: [{ id: 99, name: 'K/DA', description: 'music' }], zhSkinlines: [{ id: 99, name: 'K/DA', description: '音乐' }],
  defaultUniverses: [{ id: 200, name: 'Pop', description: 'world', imagePath: '', skinSets: [99] }], zhUniverses: [{ id: 200, name: '流行', description: '世界', imagePath: '', skinSets: [99] }],
  championDetails: [{ id: 103, default: { id: 103, name: 'Ahri', title: 'The Nine-Tailed Fox', shortBio: 'bio', squarePortraitPath: '/lol-game-data/assets/v1/champion-icons/103.png', skins: [{ id: 103000, name: 'Ahri', isBase: true, splashPath: '/lol-game-data/assets/ASSETS/Characters/Ahri/Base.jpg', uncenteredSplashPath: '/lol-game-data/assets/ASSETS/Characters/Ahri/Base-u.jpg' }, { id: 103085, name: 'Risen Legend Ahri', isBase: false, isLegacy: false, skinLines: [{ id: 99 }], splashPath: '/lol-game-data/assets/ASSETS/Characters/Ahri/Skin.jpg', questSkinInfo: { tiers: [{ id: 103085, name: 'Risen Legend Ahri', stage: 1, splashPath: '/lol-game-data/assets/ASSETS/Characters/Ahri/Skin.jpg' }, { id: 103086, name: 'Immortalized Legend Ahri', stage: 2, splashPath: '/lol-game-data/assets/ASSETS/Characters/Ahri/Skin2.jpg', splashVideoPath: '/game/ahri.webm' }, { name: 'Ascended Legend Ahri', stage: 3, splashPath: '/lol-game-data/assets/ASSETS/Characters/Ahri/Skin3.jpg' }] } }] }, zh: { id: 103, name: '九尾妖狐', title: '阿狸', shortBio: '简介', squarePortraitPath: '/lol-game-data/assets/v1/champion-icons/103.png', skins: [{ id: 103000, name: '阿狸', isBase: true, splashPath: '/lol-game-data/assets/ASSETS/Characters/Ahri/Base.jpg' }, { id: 103085, name: '名望阿狸', isBase: false, skinLines: [{ id: 99 }], splashPath: '/lol-game-data/assets/ASSETS/Characters/Ahri/Skin.jpg' }] } }],
} as const;

describe('PBE content graph', () => {
  it('merges zh overlay, keeps legacy/quest stages, and derives relationships by IDs', () => {
    const graph = buildPbeGraph(snapshot);
    const champion = graph.championsById.get(103)!;
    expect(champion.nameZh).toBe('阿狸');
    expect(champion.titleZh).toBe('九尾妖狐');
    expect(champion.stageRefs.some((stage) => stage.id === 103086)).toBe(true);
    expect(champion.stageRefs.some((stage) => !stage.id && stage.key === 'stage-3')).toBe(true);
    expect(graph.skinsById.has(103087)).toBe(false);
    const stage = graph.skinsById.get(103086)!;
    expect(stage.parentSkinId).toBe(103085);
    expect(stage.media.focusedAnimatedSplashUrl).toContain('/pbe/game/ahri.webm');
    expect(graph.skinsBySkinlineId.get(99)?.some((skin) => skin.id === 103085)).toBe(true);
    expect(graph.skinsByUniverseId.get(200)?.some((skin) => skin.id === 103085)).toBe(true);
  });

  it('keeps valid champion IDs above 1000 in the canonical graph', () => {
    const highId = {
      id: 1001,
      name: 'Testchamp',
      title: 'A test champion',
      skins: [{ id: 1001000, name: 'Testchamp', isBase: true }],
    };
    const graph = buildPbeGraph({
      ...snapshot,
      defaultSummary: [...snapshot.defaultSummary, { id: 1001, name: 'Testchamp', title: 'A test champion' }],
      championDetails: [...snapshot.championDetails, { id: 1001, default: highId }],
    });
    expect(graph.championsById.has(1001)).toBe(true);
  });

  it('fails fast when canonical entity IDs are duplicated', () => {
    expect(() => buildPbeGraph({ ...snapshot, defaultSkinlines: [{ id: 99, name: 'K/DA' }, { id: 99, name: 'Duplicate' }] })).toThrow(/Duplicate CommunityDragon entity id: 99/);
  });

  it('fails fast when one champion reuses a skin or standalone stage ID', () => {
    const duplicateSkin = {
      ...snapshot.championDetails[0],
      default: {
        ...snapshot.championDetails[0].default,
        skins: [
          ...snapshot.championDetails[0].default.skins,
          { id: 103085, name: 'Duplicate skin', isBase: false },
        ],
      },
    };
    expect(() => buildPbeGraph({ ...snapshot, championDetails: [duplicateSkin] })).toThrow(/Duplicate skin id: 103085/);

    const duplicateStage = {
      ...snapshot.championDetails[0],
      default: {
        ...snapshot.championDetails[0].default,
        skins: snapshot.championDetails[0].default.skins.map((skin) => skin.id === 103085
          ? { ...skin, questSkinInfo: { tiers: [...skin.questSkinInfo!.tiers, { id: 103086, name: 'Duplicate stage', stage: 4 }] } }
          : skin),
      },
    };
    expect(() => buildPbeGraph({ ...snapshot, championDetails: [duplicateStage] })).toThrow(/Duplicate skin stage id: 103086/);
  });
});
