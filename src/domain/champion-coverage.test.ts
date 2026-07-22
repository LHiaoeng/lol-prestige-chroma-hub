import { describe, expect, it } from 'vitest';
import { buildChampionCoverage, championCoverageCopy, latestGameVersion } from './champion-coverage';

const en = [
  { id: -1, name: 'None', description: '', alias: 'None', squarePortraitPath: '/lol-game-data/assets/v1/champion-icons/-1.png' },
  { id: 2, name: 'Olaf', description: 'the Berserker', alias: 'Olaf', squarePortraitPath: '/lol-game-data/assets/v1/champion-icons/2.png' },
  { id: 1, name: 'Annie', description: 'the Dark Child', alias: 'Annie', squarePortraitPath: '/lol-game-data/assets/v1/champion-icons/1.png' },
];
const zh = [
  { id: 1, name: '黑暗之女', description: '安妮', alias: 'Annie', squarePortraitPath: '/lol-game-data/assets/v1/champion-icons/1.png' },
];

describe('champion coverage', () => {
  it('joins localized records, filters placeholders, computes coverage, and sorts A-Z', () => {
    const snapshot = buildChampionCoverage(en, zh, ['2'], '26.14');
    expect(snapshot).toMatchObject({
      totalChampions: 2,
      coveredChampions: 1,
      missingChampions: 1,
      coveragePercent: 50,
      patchVersion: '26.14',
    });
    expect(snapshot.champions).toEqual([
      expect.objectContaining({ id: '1', alias: 'Annie', nameEn: 'Annie', nameZh: '安妮' }),
    ]);
    expect(snapshot.champions[0].portraitUrl).toBe(
      'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/1.png',
    );
  });

  it('uses the English name when the Chinese summary has no matching ID', () => {
    expect(buildChampionCoverage(en, zh, ['1'], '26.14').champions[0].nameZh).toBe('Olaf');
  });

  it('rejects duplicate positive IDs and covered IDs absent from the English source', () => {
    expect(() => buildChampionCoverage([...en, en[1]], zh, [], '26.14')).toThrow(/duplicate/i);
    expect(() => buildChampionCoverage(en, zh, ['999'], '26.14')).toThrow(/unknown covered/i);
  });

  it('rejects invalid payloads and patch versions', () => {
    expect(() => buildChampionCoverage({}, zh, [], '26.14')).toThrow();
    expect(() => buildChampionCoverage(en, zh, [], 'latest')).toThrow(/patch/i);
  });

  it('generates every variable sentence from one snapshot', () => {
    const copy = championCoverageCopy(buildChampionCoverage(en, zh, ['2'], '26.14'));
    expect(copy.deckEn).toContain('1 out of 2');
    expect(copy.deckZh).toContain('2 位英雄中已有 1 位');
    expect(copy.listIntroEn).toContain('A–Z');
    expect(copy.coverageValue).toBe('50%');
  });

  it('selects the highest dotted game version', () => {
    expect(latestGameVersion(['26.9', '26.14', '25.24'])).toBe('26.14');
    expect(() => latestGameVersion([])).toThrow(/empty/i);
  });
});
