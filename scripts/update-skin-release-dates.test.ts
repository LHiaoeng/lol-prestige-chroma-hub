import { describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildReleaseSnapshot, parseLuaTable, parseReleaseSnapshot, updateSkinReleaseDates } from '../.agents/skills/lol-skin-release-dates/scripts/update-skin-release-dates';

const lua = `-- Wiki fixture
return {
  ["Annie"] = {
    ["id"] = 1,
    ["skins"] = {
      ["Original"] = { ["id"] = 0, ["release"] = "2009-02-21", ["availability"] = "Available" },
      ["New"] = { ["id"] = 1, ["release"] = "2026-01-01", ["availability"] = "Available" },
      ["Planned"] = { ["id"] = 2, ["release"] = "2027-01-01", ["availability"] = "Upcoming" },
      ["Canceled"] = { ["id"] = nil, ["release"] = "N/A", ["availability"] = "Canceled" }
    }
  }
}`;

const cdSkins = {
  '1000': { id: 1000, name: 'Annie' },
  '1001': { id: 1001, name: 'New Annie' },
  '1002': { id: 1002, name: 'Planned Annie' },
  '1003': { id: 1003, name: 'CD-only Annie' },
};
const cdChineseSkins = {
  '1000': { id: 1000, name: '黑暗之女' },
  '1001': { id: 1001, name: '哥特萝莉 安妮' },
  '1002': { id: 1002, name: '小红帽 安妮' },
  '1003': { id: 1003, name: 'CD 测试皮肤' },
};
const cdChampions = [{ id: 1, name: 'Annie', description: 'the Dark Child' }];
const cdChineseChampions = [{ id: 1, name: '黑暗之女', description: '安妮' }];

const previous = {
  schemaVersion: 1,
  skins: [{ championId: 1, skinId: 1000, skinName: 'Annie', globalReleaseDate: '2009-02-22', chinaReleaseDate: null }],
};

function build(overrides: Record<string, unknown> = {}) {
  return buildReleaseSnapshot({
    wikiTable: parseLuaTable(lua), cdSkins, cdChineseSkins, cdChampions, cdChineseChampions,
    previous, today: '2026-01-02', ...overrides,
  });
}

describe('skin release update', () => {
  it('parses the complete literal Lua table and rejects expressions', () => {
    expect(parseLuaTable(lua).Annie).toBeDefined();
    expect(() => parseLuaTable('return { ["x"] = os.execute("bad") }')).toThrow(/Unsupported Lua|Expected Lua/);
  });

  it('adds live skins, fills past dates, preserves confirmed dates and reports exceptions', () => {
    const { snapshot, report } = build();
    expect(Object.keys(snapshot)).toEqual(['schemaVersion', 'skins']);
    expect(snapshot.skins.map((skin) => skin.skinId)).toEqual([1000, 1001, 1002, 1003]);
    expect(Object.keys(snapshot.skins[0])).toEqual(['championId', 'skinId', 'skinName', 'skinNameZh', 'globalReleaseDate', 'chinaReleaseDate', 'globalReleaseVersion', 'chinaReleaseVersion']);
    expect(snapshot.skins[0]).toMatchObject({ globalReleaseVersion: null, chinaReleaseVersion: null });
    expect(snapshot.skins[0]).toMatchObject({ globalReleaseDate: '2009-02-22' });
    expect(snapshot.skins[0]).toMatchObject({ skinName: 'the Dark Child Annie', skinNameZh: '黑暗之女 安妮' });
    expect(snapshot.skins[1]).toMatchObject({ globalReleaseDate: '2026-01-01' });
    expect(snapshot.skins[2].globalReleaseDate).toBeNull();
    expect(report).toMatchObject({
      added: [1001, 1002, 1003], globalDatesFilled: [1001], cdWithoutWiki: [{ skinId: 1003, skinName: 'CD-only Annie' }],
      futureWikiDates: [1002], existingDateConflicts: [{ skinId: 1000, server: 'global', storedDate: '2009-02-22', sourceDate: '2009-02-21' }],
      wikiWithoutId: [{ championName: 'Annie', skinName: 'Canceled', releaseDate: null, availability: 'Canceled' }],
    });
  });

  it('fills a China date once and preserves it on later imports', () => {
    const chinaDates = [{ skinId: 1001, releaseDate: '2026-01-02' }];
    const first = build({ chinaDates });
    expect(first.snapshot.skins[1]).toMatchObject({ chinaReleaseDate: '2026-01-02' });
    expect(first.report.chinaDatesFilled).toEqual([1001]);
    const second = build({ previous: first.snapshot, chinaDates: [{ ...chinaDates[0], releaseDate: '2026-01-01' }] });
    expect(second.snapshot.skins[1].chinaReleaseDate).toBe('2026-01-02');
    expect(second.report.existingDateConflicts).toContainEqual({ skinId: 1001, server: 'china', storedDate: '2026-01-02', sourceDate: '2026-01-01' });
  });

  it('fills version fields once, preserves existing values and reports conflicts', () => {
    const first = build({ versions: [{ skinId: 1000, globalReleaseVersion: 'V1.0' }, { skinId: 1001, globalReleaseVersion: 'V2.1', chinaReleaseVersion: '12.3' }] });
    expect(first.snapshot.skins[0].globalReleaseVersion).toBe('V1.0');
    expect(first.snapshot.skins[1]).toMatchObject({ globalReleaseVersion: 'V2.1', chinaReleaseVersion: '12.3' });
    expect(first.report.globalVersionsFilled).toEqual([1000, 1001]);
    const second = build({ previous: first.snapshot, versions: [{ skinId: 1000, globalReleaseVersion: 'V1.1' }] });
    expect(second.snapshot.skins[0].globalReleaseVersion).toBe('V1.0');
    expect(second.report.existingVersionConflicts).toEqual([{ skinId: 1000, server: 'global', storedVersion: 'V1.0', sourceVersion: 'V1.1' }]);
  });

  it('adds China dates offline and skips already dated skins', async () => {
    const root = await mkdtemp(join(tmpdir(), 'skin-release-china-test-'));
    const saved = build({ chinaDates: [{ skinId: 1000, releaseDate: '2026-01-01' }] }).snapshot;
    const inputPath = join(root, 'china.json');
    try {
      await mkdir(join(root, 'data'));
      await writeFile(join(root, 'data/skin-release-dates.json'), `${JSON.stringify(saved)}\n`);
      await writeFile(inputPath, JSON.stringify([{ skinId: 1000, releaseDate: '2025-01-01' }, { skinId: 1001, releaseDate: '2026-01-02' }]));
      const fetcher = (() => { throw new Error('China-only update must not fetch remote sources'); }) as typeof fetch;
      const report = await updateSkinReleaseDates({ root, chinaInput: inputPath, fetcher, today: '2026-01-02' });
      expect(report.chinaDatesFilled).toEqual([1001]);
      expect(report.existingDateConflicts).toContainEqual({ skinId: 1000, server: 'china', storedDate: '2026-01-01', sourceDate: '2025-01-01' });
      await updateSkinReleaseDates({ root, chinaInput: inputPath, fetcher, today: '2026-01-02', apply: true });
      const updated = JSON.parse(await readFile(join(root, 'data/skin-release-dates.json'), 'utf8'));
      expect(updated.skins[0].chinaReleaseDate).toBe('2026-01-01');
      expect(updated.skins[1].chinaReleaseDate).toBe('2026-01-02');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('adds version inputs offline without fetching sources', async () => {
    const root = await mkdtemp(join(tmpdir(), 'skin-release-version-test-'));
    const saved = build().snapshot;
    const inputPath = join(root, 'versions.json');
    try {
      await mkdir(join(root, 'data'));
      await writeFile(join(root, 'data/skin-release-dates.json'), `${JSON.stringify(saved)}\n`);
      await writeFile(inputPath, JSON.stringify([{ skinId: 1001, globalReleaseVersion: 'V2.1', chinaReleaseVersion: '12.3' }]));
      const fetcher = (() => { throw new Error('Version-only update must not fetch remote sources'); }) as typeof fetch;
      const report = await updateSkinReleaseDates({ root, versionInput: inputPath, fetcher, today: '2026-01-02' });
      expect(report.globalVersionsFilled).toEqual([1001]);
      expect(report.chinaVersionsFilled).toEqual([1001]);
      await updateSkinReleaseDates({ root, versionInput: inputPath, fetcher, today: '2026-01-02', apply: true });
      const updated = JSON.parse(await readFile(join(root, 'data/skin-release-dates.json'), 'utf8'));
      expect(updated.skins[1]).toMatchObject({ globalReleaseVersion: 'V2.1', chinaReleaseVersion: '12.3' });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('is idempotent after the first successful update', () => {
    const first = build();
    const second = build({ previous: first.snapshot });
    expect(second.snapshot).toEqual(first.snapshot);
    expect(second.report.added).toEqual([]);
    expect(second.report.globalDatesFilled).toEqual([]);
    expect(second.report.chinaDatesFilled).toEqual([]);
  });

  it('validates a saved snapshot without accessing either source', () => {
    const { snapshot } = build();
    expect(parseReleaseSnapshot(snapshot).skins).toHaveLength(4);
    const broken = structuredClone(snapshot);
    broken.skins[0].chinaReleaseDate = '2026-02-30';
    expect(() => parseReleaseSnapshot(broken)).toThrow(/not a real date/);
    expect(() => build({ previous: broken })).toThrow(/not a real date/);
  });

  it('reports a previously saved skin disappearing from CD', () => {
    const first = build();
    const second = build({ previous: first.snapshot, cdSkins: { '1000': cdSkins['1000'] } });
    expect(second.report.disappearedFromCd).toEqual([1001, 1002, 1003]);
  });

  it('blocks removal when the CD champion summary is incomplete', () => {
    const first = build();
    const second = build({ previous: first.snapshot, cdChampions: [] });
    expect(second.snapshot.skins).toEqual([]);
    expect(second.report.disappearedFromCd).toEqual([1000, 1001, 1002, 1003]);
  });

  it('uses CD membership to include a skin regardless of Wiki availability', () => {
    const { snapshot, report } = build({ wikiTable: parseLuaTable(lua.replace('2027-01-01', '2025-01-01')) });
    expect(snapshot.skins[2].globalReleaseDate).toBe('2025-01-01');
    expect(report.futureWikiDates).toEqual([]);
    const canceled = build({ wikiTable: parseLuaTable(lua.replace('["id"] = nil, ["release"] = "N/A"', '["id"] = 3, ["release"] = "2025-01-01"')) });
    expect(canceled.snapshot.skins[3].globalReleaseDate).toBe('2025-01-01');
  });

  it('excludes Jade synthetic champion skins from the live catalog', () => {
    const { snapshot, report } = build({
      cdChampions: [...cdChampions, { id: 60001, alias: 'Jade_Annie' }],
      cdChineseChampions: [...cdChineseChampions, { id: 60001, alias: 'Jade_Annie' }],
      cdSkins: { ...cdSkins, '60001301': { id: 60001301, name: 'Synthetic Annie' } },
    });
    expect(snapshot.skins).toHaveLength(4);
    expect(report.excludedUnknownChampion).toEqual([{ skinId: 60001301, skinName: 'Synthetic Annie' }]);
  });

  it('rejects impossible dates and duplicate Wiki IDs', () => {
    expect(() => build({ wikiTable: parseLuaTable(lua.replace('2026-01-01', '2026-02-30')) })).toThrow(/not a real date/);
    expect(() => build({ wikiTable: parseLuaTable(lua.replace('["New"] = { ["id"] = 1', '["New"] = { ["id"] = 0')) })).toThrow(/Duplicate Wiki skin ID/);
  });

  it('imports the Wiki raw module when its API returns 403', async () => {
    const root = await mkdtemp(join(tmpdir(), 'skin-release-wiki-raw-test-'));
    const fetcher = (async (url: string) => {
      if (url.includes('/api.php')) return new Response('blocked', { status: 403 });
      if (url.includes('Module:SkinData/data?action=raw')) return new Response(lua, { headers: { 'Content-Type': 'text/x-wiki' } });
      const value = url.includes('/zh_cn/') ? (url.endsWith('/skins.json') ? cdChineseSkins : cdChineseChampions)
        : url.endsWith('/skins.json') ? cdSkins : cdChampions;
      return new Response(JSON.stringify(value));
    }) as typeof fetch;
    try {
      const report = await updateSkinReleaseDates({ root, fetcher, today: '2026-01-02' });
      expect(report.added).toEqual([1000, 1001, 1002, 1003]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('keeps existing dates and reports a blocked Wiki source', async () => {
    const root = await mkdtemp(join(tmpdir(), 'skin-release-wiki-blocked-test-'));
    const fetcher = (async (url: string) => {
      if (url.includes('Module:SkinData/data?action=raw')) return new Response('blocked', { status: 403 });
      const value = url.includes('/zh_cn/') ? (url.endsWith('/skins.json') ? cdChineseSkins : cdChineseChampions)
        : url.endsWith('/skins.json') ? cdSkins : cdChampions;
      return new Response(JSON.stringify(value));
    }) as typeof fetch;
    try {
      await expect(updateSkinReleaseDates({ root, fetcher, today: '2026-01-02' })).rejects.toThrow(/no saved release snapshot/);
      await mkdir(join(root, 'data'));
      await writeFile(join(root, 'data/skin-release-dates.json'), JSON.stringify(previous));
      const report = await updateSkinReleaseDates({ root, fetcher, today: '2026-01-02' });
      const candidate = JSON.parse(await readFile(join(root, '.tmp/skin-release-candidate.json'), 'utf8'));
      expect(report.unavailableSources).toEqual(['League Wiki HTTP 403']);
      expect(report.cdWithoutWiki).toEqual([]);
      expect(candidate.skins.find((skin: { skinId: number }) => skin.skinId === 1000).globalReleaseDate).toBe('2009-02-22');
      expect(candidate.skins.find((skin: { skinId: number }) => skin.skinId === 1001).globalReleaseDate).toBeNull();
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('accepts a local Wiki module when remote access is blocked', async () => {
    const root = await mkdtemp(join(tmpdir(), 'skin-release-wiki-file-test-'));
    const wikiSource = join(root, 'skin-data.lua');
    const fetcher = (async (url: string) => {
      if (url.includes('wiki.leagueoflegends.com')) throw new Error('Wiki must be read from the local file');
      const value = url.includes('/zh_cn/') ? (url.endsWith('/skins.json') ? cdChineseSkins : cdChineseChampions)
        : url.endsWith('/skins.json') ? cdSkins : cdChampions;
      return new Response(JSON.stringify(value));
    }) as typeof fetch;
    try {
      await writeFile(wikiSource, lua);
      const report = await updateSkinReleaseDates({ root, fetcher, wikiSource, today: '2026-01-02' });
      expect(report.globalDatesFilled).toEqual([1000, 1001]);
      expect(report.unavailableSources).toEqual([]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('applies only the exact candidate that was previewed', async () => {
    const root = await mkdtemp(join(tmpdir(), 'skin-release-test-'));
    let currentSkins = cdSkins;
    const fetcher = (async (url: string) => {
      if (url.includes('Module:SkinData/data?action=raw')) return new Response(lua);
      const value = url.includes('/zh_cn/') ? (url.endsWith('/skins.json') ? cdChineseSkins : cdChineseChampions)
      : url.endsWith('/skins.json') ? currentSkins : cdChampions;
      return new Response(JSON.stringify(value));
    }) as typeof fetch;
    try {
      await updateSkinReleaseDates({ root, fetcher, today: '2026-01-02' });
      currentSkins = { ...cdSkins, '1003': { id: 1003, name: 'Changed CD-only Annie' } };
      await expect(updateSkinReleaseDates({ root, fetcher, today: '2026-01-02', apply: true })).rejects.toThrow(/changed since preview/);
      currentSkins = cdSkins;
      await updateSkinReleaseDates({ root, fetcher, today: '2026-01-02', apply: true });
      const saved = JSON.parse(await readFile(join(root, 'data/skin-release-dates.json'), 'utf8'));
      expect(saved.skins).toHaveLength(4);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
