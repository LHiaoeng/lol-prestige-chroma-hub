import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const WIKI_URL = 'https://wiki.leagueoflegends.com/en-us/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&titles=Module%3ASkinData%2Fdata&format=json';
const CD_ROOT = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1';
const CD_ZH_ROOT = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/zh_cn/v1';
const SKINS_URL = `${CD_ROOT}/skins.json`;
const ZH_SKINS_URL = `${CD_ZH_ROOT}/skins.json`;
const CHAMPIONS_URL = `${CD_ROOT}/champion-summary.json`;
const ZH_CHAMPIONS_URL = `${CD_ZH_ROOT}/champion-summary.json`;
const OUTPUT = 'data/skin-release-dates.json';
const REPORT = '.tmp/skin-release-report.json';
const CANDIDATE = '.tmp/skin-release-candidate.json';

type RecordValue = Record<string, unknown>;

export interface ReleaseSkin {
  championId: number;
  skinId: number;
  skinName: string;
  skinNameZh: string;
  globalReleaseDate: string | null;
  chinaReleaseDate: string | null;
  globalReleaseVersion: string | null;
  chinaReleaseVersion: string | null;
}

export interface ReleaseSnapshot {
  schemaVersion: 1;
  skins: ReleaseSkin[];
}

interface WikiSkin {
  championId: number;
  skinId: number | null;
  championName: string;
  skinName: string;
  releaseDate: string | null;
  availability: string;
}

interface ChinaDateInput {
  skinId: number;
  releaseDate: string;
}

interface VersionInput {
  skinId: number;
  globalReleaseVersion?: string;
  chinaReleaseVersion?: string;
}

export interface UpdateReport {
  added: number[];
  globalDatesFilled: number[];
  chinaDatesFilled: number[];
  globalVersionsFilled: number[];
  chinaVersionsFilled: number[];
  wikiWithoutId: Array<{ championName: string; skinName: string; releaseDate: string | null; availability: string }>;
  wikiWithoutCd: Array<{ skinId: number; championName: string; skinName: string; releaseDate: string | null; availability: string }>;
  cdWithoutWiki: Array<{ skinId: number; skinName: string }>;
  futureWikiDates: number[];
  existingDateConflicts: Array<{ skinId: number; server: 'global' | 'china'; storedDate: string; sourceDate: string }>;
  existingVersionConflicts: Array<{ skinId: number; server: 'global' | 'china'; storedVersion: string; sourceVersion: string }>;
  disappearedFromCd: number[];
  excludedUnknownChampion: Array<{ skinId: number; skinName: string }>;
}

function emptyReport(): UpdateReport {
  return {
    added: [], globalDatesFilled: [], chinaDatesFilled: [], globalVersionsFilled: [], chinaVersionsFilled: [], wikiWithoutId: [],
    wikiWithoutCd: [], cdWithoutWiki: [], futureWikiDates: [], existingDateConflicts: [], existingVersionConflicts: [],
    disappearedFromCd: [], excludedUnknownChampion: [],
  };
}

export function parseReleaseSnapshot(value: unknown): ReleaseSnapshot {
  const snapshot = object(value, 'Skin release snapshot');
  if (snapshot.schemaVersion !== 1) throw new Error('Unsupported skin release snapshot version');
  if (!Array.isArray(snapshot.skins)) throw new Error('Skin release snapshot has no skins array');
  const seen = new Set<number>();
  const skins: ReleaseSkin[] = [];
  for (const raw of snapshot.skins) {
    const skin = object(raw, 'Skin release record');
    const championId = integer(skin.championId, 'Champion ID');
    const skinId = integer(skin.skinId, 'Skin ID');
    if (Math.floor(skinId / 1000) !== championId || seen.has(skinId)) throw new Error(`Invalid or duplicate skin ID ${skinId}`);
    seen.add(skinId);
    if (typeof skin.skinName !== 'string' || !skin.skinName || typeof skin.skinNameZh !== 'string' || !skin.skinNameZh) throw new Error(`Invalid skin ${skinId} names`);
    if (skin.globalReleaseDate !== null) date(skin.globalReleaseDate, `Global date ${skinId}`);
    if (skin.chinaReleaseDate !== null) date(skin.chinaReleaseDate, `China date ${skinId}`);
    const globalReleaseVersion = version(skin.globalReleaseVersion ?? null, `Global version ${skinId}`);
    const chinaReleaseVersion = version(skin.chinaReleaseVersion ?? null, `China version ${skinId}`);
    skins.push({ ...skin, globalReleaseVersion, chinaReleaseVersion } as unknown as ReleaseSkin);
  }
  return { ...snapshot, skins } as unknown as ReleaseSnapshot;
}

function object(value: unknown, label: string): RecordValue {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`);
  return value as RecordValue;
}

function integer(value: unknown, label: string, allowZero = false): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < (allowZero ? 0 : 1)) {
    throw new Error(`${label} must be a valid integer`);
  }
  return value;
}

function date(value: unknown, label: string): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`${label} must be YYYY-MM-DD`);
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new Error(`${label} is not a real date`);
  return value;
}

function version(value: unknown, label: string): string | null {
  if (value === null) return null;
  if (typeof value !== 'string' || !value || value.trim() !== value) throw new Error(`${label} must be a non-empty string or null`);
  return value;
}

// Parse the data module's literal Lua table; unsupported syntax fails closed and remote Lua is never executed.
export function parseLuaTable(source: string): RecordValue {
  const tokenPattern = /\s+|--\[\[[\s\S]*?\]\]|--[^\n]*|\[\[[\s\S]*?\]\]|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|-?\d+(?:\.\d+)?|[A-Za-z_]\w*|[{}\[\]=,;]/gy;
  const tokens: string[] = [];
  let offset = 0;
  while (offset < source.length) {
    tokenPattern.lastIndex = offset;
    const match = tokenPattern.exec(source);
    if (!match) throw new Error(`Unsupported Lua syntax at offset ${offset}`);
    const token = match[0];
    if (!/^\s/.test(token) && !token.startsWith('--')) tokens.push(token);
    offset = tokenPattern.lastIndex;
  }
  let index = 0;
  const take = () => {
    const token = tokens[index++];
    if (token === undefined) throw new Error('Unexpected end of Lua data');
    return token;
  };
  const expect = (wanted: string) => {
    if (take() !== wanted) throw new Error(`Expected Lua token ${wanted}`);
  };
  const value = (): unknown => {
    const token = take();
    if (token === '{') {
      const fields: RecordValue = {};
      // Wiki has duplicate metadata fields; Lua keeps the last assignment.
      let arrayIndex = 1;
      while (tokens[index] !== '}') {
        let key: string;
        if (tokens[index] === '[') {
          index++;
          const parsedKey = value();
          if (typeof parsedKey !== 'string' && typeof parsedKey !== 'number') throw new Error('Invalid Lua table key');
          key = String(parsedKey);
          expect(']');
          expect('=');
          fields[key] = value();
        } else if (tokens[index + 1] === '=') {
          key = take();
          expect('=');
          fields[key] = value();
        } else {
          key = String(arrayIndex++);
          fields[key] = value();
        }
        if (tokens[index] === ',' || tokens[index] === ';') index++;
        else if (tokens[index] !== '}') throw new Error('Expected Lua table separator');
      }
      index++;
      return fields;
    }
    if (token.startsWith('"')) return JSON.parse(token) as string;
    if (token.startsWith("'")) throw new Error('Unsupported single-quoted Lua string');
    if (token.startsWith('[[')) return token.slice(2, -2);
    if (token === 'true') return true;
    if (token === 'false') return false;
    if (token === 'nil') return null;
    if (/^-?\d+(?:\.\d+)?$/.test(token)) return Number(token);
    throw new Error(`Unsupported Lua value: ${token}`);
  };
  expect('return');
  const result = object(value(), 'Wiki data');
  if (index !== tokens.length) throw new Error('Trailing Lua data');
  return result;
}

export function wikiSkins(table: RecordValue): WikiSkin[] {
  const result: WikiSkin[] = [];
  const seenIds = new Set<number>();
  for (const [championName, rawChampion] of Object.entries(table)) {
    const champion = object(rawChampion, `Wiki champion ${championName}`);
    const championId = integer(champion.id, `Wiki champion ${championName} ID`);
    const skins = object(champion.skins, `Wiki champion ${championName} skins`);
    for (const [skinName, rawSkin] of Object.entries(skins)) {
      const skin = object(rawSkin, `Wiki skin ${championName}/${skinName}`);
      const localId = skin.id === null ? null : integer(skin.id, `Wiki skin ${championName}/${skinName} ID`, true);
      if (localId !== null && localId >= 1000) throw new Error(`Invalid Wiki local skin ID: ${championName}/${skinName}`);
      const skinId = localId === null ? null : championId * 1000 + localId;
      if (skinId !== null) {
        if (seenIds.has(skinId)) throw new Error(`Duplicate Wiki skin ID ${skinId}`);
        seenIds.add(skinId);
      }
      const releaseDate = skin.release === 'N/A' ? null : date(skin.release, `Wiki skin ${championName}/${skinName} release`);
      if (typeof skin.availability !== 'string' || !skin.availability) throw new Error(`Missing Wiki availability: ${championName}/${skinName}`);
      result.push({ championId, skinId, championName, skinName, releaseDate, availability: skin.availability });
    }
  }
  return result;
}

function previousSkins(value: unknown): { migrated: boolean; byId: Map<number, RecordValue> } {
  const document = object(value, 'Existing snapshot');
  if (!Array.isArray(document.skins)) throw new Error('Existing snapshot has no skins array');
  if (document.schemaVersion !== undefined && document.schemaVersion !== 1) throw new Error('Unsupported existing snapshot version');
  const migrated = document.schemaVersion === 1;
  if (migrated) {
    parseReleaseSnapshot({
      ...document,
      skins: (document.skins as unknown[]).map((raw) => {
        const skin = object(raw, 'Existing skin');
        return { ...skin, skinNameZh: skin.skinNameZh ?? skin.skinName };
      }),
    });
  }
  const byId = new Map<number, RecordValue>();
  for (const raw of document.skins) {
    const skin = object(raw, 'Existing skin');
    if (skin.skinId === null) continue;
    const id = integer(skin.skinId, 'Existing skin ID');
    if (byId.has(id)) throw new Error(`Duplicate existing skin ID ${id}`);
    byId.set(id, skin);
  }
  return { migrated, byId };
}

function chinaInputs(value: unknown): Map<number, ChinaDateInput> {
  if (value === undefined) return new Map();
  if (!Array.isArray(value)) throw new Error('China date input must be an array');
  const inputs = new Map<number, ChinaDateInput>();
  for (const raw of value) {
    const item = object(raw, 'China date input');
    const skinId = integer(item.skinId, 'China date skin ID');
    const releaseDate = date(item.releaseDate, `China date for ${skinId}`);
    if (inputs.has(skinId)) throw new Error(`Duplicate China date input ${skinId}`);
    inputs.set(skinId, { skinId, releaseDate });
  }
  return inputs;
}

function versionInputs(value: unknown): Map<number, VersionInput> {
  if (value === undefined) return new Map();
  if (!Array.isArray(value)) throw new Error('Version input must be an array');
  const inputs = new Map<number, VersionInput>();
  for (const raw of value) {
    const item = object(raw, 'Version input');
    const skinId = integer(item.skinId, 'Version skin ID');
    const globalReleaseVersion = item.globalReleaseVersion === undefined ? undefined : version(item.globalReleaseVersion, `Global version ${skinId}`) ?? undefined;
    const chinaReleaseVersion = item.chinaReleaseVersion === undefined ? undefined : version(item.chinaReleaseVersion, `China version ${skinId}`) ?? undefined;
    if (globalReleaseVersion === undefined && chinaReleaseVersion === undefined) throw new Error(`Version input ${skinId} has no version`);
    if (inputs.has(skinId)) throw new Error(`Duplicate version input ${skinId}`);
    inputs.set(skinId, { skinId, globalReleaseVersion, chinaReleaseVersion });
  }
  return inputs;
}

export function buildReleaseSnapshot(input: {
  wikiTable: RecordValue;
  cdSkins: unknown;
  cdChineseSkins: unknown;
  cdChampions: unknown;
  cdChineseChampions: unknown;
  previous: unknown;
  chinaDates?: unknown;
  versions?: unknown;
  today: string;
}): { snapshot: ReleaseSnapshot; report: UpdateReport } {
  date(input.today, 'Today');
  const previous = previousSkins(input.previous);
  const manual = chinaInputs(input.chinaDates);
  const versions = versionInputs(input.versions);
  if (!Array.isArray(input.cdChampions)) throw new Error('CD champion summary must be an array');
  const championIds = new Set<number>();
  const championsById = new Map<number, RecordValue>();
  for (const raw of input.cdChampions) {
    const champion = object(raw, 'CD champion');
    if (champion.id === -1 && champion.alias === 'None') continue;
    // Match the Jade synthetic champion exclusion in communitydragon-runtime.ts.
    if (typeof champion.id === 'number' && champion.id >= 60000 && champion.id < 70000 && typeof champion.alias === 'string' && champion.alias.startsWith('Jade_')) continue;
    const championId = integer(champion.id, 'CD champion ID');
    championIds.add(championId);
    championsById.set(championId, champion);
  }
  if (!Array.isArray(input.cdChineseChampions)) throw new Error('CD Chinese champion summary must be an array');
  const chineseChampionsById = new Map<number, RecordValue>();
  for (const raw of input.cdChineseChampions) {
    const champion = object(raw, 'CD Chinese champion');
    if (champion.id === -1 && champion.alias === 'None') continue;
    if (typeof champion.id === 'number' && champion.id >= 60000 && champion.id < 70000 && typeof champion.alias === 'string' && champion.alias.startsWith('Jade_')) continue;
    chineseChampionsById.set(integer(champion.id, 'CD Chinese champion ID'), champion);
  }
  const cd = object(input.cdSkins, 'CD skins');
  const cdChinese = object(input.cdChineseSkins, 'CD Chinese skins');
  const wiki = wikiSkins(input.wikiTable);
  const wikiById = new Map(wiki.filter((skin) => skin.skinId !== null).map((skin) => [skin.skinId!, skin]));
  const report = emptyReport();
  const liveIds = new Set<number>();
  const includedIds = new Set<number>();
  const skins: ReleaseSkin[] = [];
  for (const [key, raw] of Object.entries(cd)) {
    const cdSkin = object(raw, `CD skin ${key}`);
    const skinId = integer(cdSkin.id, `CD skin ${key} ID`);
    if (key !== String(skinId)) throw new Error(`CD skin key and ID differ: ${key}`);
    if (liveIds.has(skinId)) throw new Error(`Duplicate CD skin ID ${skinId}`);
    liveIds.add(skinId);
    const championId = Math.floor(skinId / 1000);
    if (typeof cdSkin.name !== 'string' || !cdSkin.name) throw new Error(`CD skin ${skinId} has no name`);
    if (!championIds.has(championId)) {
      report.excludedUnknownChampion.push({ skinId, skinName: cdSkin.name });
      continue;
    }
    const cdChineseSkin = object(cdChinese[key], `CD Chinese skin ${key}`);
    if (cdChineseSkin.id !== skinId || typeof cdChineseSkin.name !== 'string' || !cdChineseSkin.name) throw new Error(`Invalid CD Chinese skin ${skinId}`);
    includedIds.add(skinId);
    const wikiSkin = wikiById.get(skinId);
    const old = previous.byId.get(skinId);
    if (!old) report.added.push(skinId);
    if (!wikiSkin) report.cdWithoutWiki.push({ skinId, skinName: cdSkin.name });

    const oldGlobalRaw = old?.globalReleaseDate ?? old?.releaseDate ?? null;
    const oldChinaRaw = old?.chinaReleaseDate ?? null;
    const oldGlobal = oldGlobalRaw === null ? null : date(oldGlobalRaw, `Existing global date ${skinId}`);
    const oldChina = oldChinaRaw === null ? null : date(oldChinaRaw, `Existing China date ${skinId}`);
    const wikiDate = wikiSkin?.releaseDate ?? null;
    const eligibleWikiDate = wikiDate !== null && wikiDate <= input.today ? wikiDate : null;
    if (wikiDate !== null && wikiDate > input.today) report.futureWikiDates.push(skinId);
    if (oldGlobal !== null && oldGlobal > input.today) throw new Error(`Future existing global date ${skinId}`);
    if (oldChina !== null && oldChina > input.today) throw new Error(`Future existing China date ${skinId}`);
    if (oldGlobal !== null && wikiDate !== null && oldGlobal !== wikiDate) report.existingDateConflicts.push({ skinId, server: 'global', storedDate: oldGlobal, sourceDate: wikiDate });
    if (oldGlobal === null && eligibleWikiDate !== null) report.globalDatesFilled.push(skinId);
    const globalReleaseDate = oldGlobal ?? eligibleWikiDate;

    const manualDate = manual.get(skinId);
    if (manualDate && manualDate.releaseDate > input.today) throw new Error(`Future China date ${skinId}`);
    if (manualDate && oldChina !== null && manualDate.releaseDate !== oldChina) report.existingDateConflicts.push({ skinId, server: 'china', storedDate: oldChina, sourceDate: manualDate.releaseDate });
    if (manualDate && oldChina === null) report.chinaDatesFilled.push(skinId);
    const chinaReleaseDate = oldChina ?? manualDate?.releaseDate ?? null;

    const oldGlobalVersion = old?.globalReleaseVersion == null ? null : version(old.globalReleaseVersion, `Existing global version ${skinId}`);
    const oldChinaVersion = old?.chinaReleaseVersion == null ? null : version(old.chinaReleaseVersion, `Existing China version ${skinId}`);
    const versionInput = versions.get(skinId);
    if (versionInput?.globalReleaseVersion && oldGlobalVersion && versionInput.globalReleaseVersion !== oldGlobalVersion) report.existingVersionConflicts.push({ skinId, server: 'global', storedVersion: oldGlobalVersion, sourceVersion: versionInput.globalReleaseVersion });
    if (versionInput?.chinaReleaseVersion && oldChinaVersion && versionInput.chinaReleaseVersion !== oldChinaVersion) report.existingVersionConflicts.push({ skinId, server: 'china', storedVersion: oldChinaVersion, sourceVersion: versionInput.chinaReleaseVersion });
    if (versionInput?.globalReleaseVersion && !oldGlobalVersion) report.globalVersionsFilled.push(skinId);
    if (versionInput?.chinaReleaseVersion && !oldChinaVersion) report.chinaVersionsFilled.push(skinId);
    const globalReleaseVersion = oldGlobalVersion ?? versionInput?.globalReleaseVersion ?? null;
    const chinaReleaseVersion = oldChinaVersion ?? versionInput?.chinaReleaseVersion ?? null;

    let skinName = cdSkin.name as string;
    let skinNameZh = cdChineseSkin.name;
    if (skinId % 1000 === 0) {
      const englishChampion = championsById.get(championId);
      const chineseChampion = chineseChampionsById.get(championId);
      if (typeof englishChampion?.name !== 'string' || typeof englishChampion.description !== 'string' || typeof chineseChampion?.name !== 'string' || typeof chineseChampion.description !== 'string') {
        throw new Error(`Missing CD champion full name ${championId}`);
      }
      skinName = `${englishChampion.description} ${englishChampion.name}`;
      skinNameZh = `${chineseChampion.name} ${chineseChampion.description}`;
    }
    skins.push({ championId, skinId, skinName, skinNameZh, globalReleaseDate, chinaReleaseDate, globalReleaseVersion, chinaReleaseVersion });
    manual.delete(skinId);
    versions.delete(skinId);
  }
  if (manual.size) throw new Error(`China date input refers to unknown live skins: ${[...manual.keys()].join(', ')}`);
  if (versions.size) throw new Error(`Version input refers to unknown live skins: ${[...versions.keys()].join(', ')}`);
  for (const skin of wiki) {
    if (skin.skinId === null) report.wikiWithoutId.push({ championName: skin.championName, skinName: skin.skinName, releaseDate: skin.releaseDate, availability: skin.availability });
    else if (!includedIds.has(skin.skinId)) report.wikiWithoutCd.push({ skinId: skin.skinId, championName: skin.championName, skinName: skin.skinName, releaseDate: skin.releaseDate, availability: skin.availability });
  }
  if (previous.migrated) {
    for (const id of previous.byId.keys()) if (!includedIds.has(id)) report.disappearedFromCd.push(id);
  }
  skins.sort((a, b) => a.championId - b.championId || a.skinId - b.skinId);
  for (const key of ['added', 'globalDatesFilled', 'chinaDatesFilled', 'globalVersionsFilled', 'chinaVersionsFilled', 'futureWikiDates', 'disappearedFromCd'] as const) report[key].sort((a, b) => a - b);
  report.wikiWithoutId.sort((a, b) => a.championName.localeCompare(b.championName) || a.skinName.localeCompare(b.skinName));
  for (const key of ['wikiWithoutCd', 'cdWithoutWiki', 'existingDateConflicts', 'existingVersionConflicts', 'excludedUnknownChampion'] as const) report[key].sort((a, b) => a.skinId - b.skinId);
  const snapshot = parseReleaseSnapshot({ schemaVersion: 1, skins });
  return { snapshot, report };
}

function buildOfflineSnapshot(previous: unknown, chinaDates: unknown, versionData: unknown, today: string): { snapshot: ReleaseSnapshot; report: UpdateReport } {
  date(today, 'Today');
  const saved = parseReleaseSnapshot(previous);
  const inputs = chinaInputs(chinaDates);
  const versions = versionInputs(versionData);
  const report = emptyReport();
  const skins = saved.skins.map((skin) => {
    if (skin.globalReleaseDate !== null && skin.globalReleaseDate > today || skin.chinaReleaseDate !== null && skin.chinaReleaseDate > today) {
      throw new Error(`Future existing date ${skin.skinId}`);
    }
    const manual = inputs.get(skin.skinId);
    if (manual) inputs.delete(skin.skinId);
    const versionInput = versions.get(skin.skinId);
    if (versionInput) versions.delete(skin.skinId);
    let chinaReleaseDate = skin.chinaReleaseDate;
    if (manual) {
      if (manual.releaseDate > today) throw new Error(`Future China date ${skin.skinId}`);
      if (chinaReleaseDate !== null) {
        if (chinaReleaseDate !== manual.releaseDate) report.existingDateConflicts.push({ skinId: skin.skinId, server: 'china', storedDate: chinaReleaseDate, sourceDate: manual.releaseDate });
      } else {
        report.chinaDatesFilled.push(skin.skinId);
        chinaReleaseDate = manual.releaseDate;
      }
    }

    let globalReleaseVersion = skin.globalReleaseVersion;
    let chinaReleaseVersion = skin.chinaReleaseVersion;
    if (versionInput?.globalReleaseVersion) {
      if (globalReleaseVersion !== null) {
        if (globalReleaseVersion !== versionInput.globalReleaseVersion) report.existingVersionConflicts.push({ skinId: skin.skinId, server: 'global', storedVersion: globalReleaseVersion, sourceVersion: versionInput.globalReleaseVersion });
      } else {
        globalReleaseVersion = versionInput.globalReleaseVersion;
        report.globalVersionsFilled.push(skin.skinId);
      }
    }
    if (versionInput?.chinaReleaseVersion) {
      if (chinaReleaseVersion !== null) {
        if (chinaReleaseVersion !== versionInput.chinaReleaseVersion) report.existingVersionConflicts.push({ skinId: skin.skinId, server: 'china', storedVersion: chinaReleaseVersion, sourceVersion: versionInput.chinaReleaseVersion });
      } else {
        chinaReleaseVersion = versionInput.chinaReleaseVersion;
        report.chinaVersionsFilled.push(skin.skinId);
      }
    }
    return { ...skin, chinaReleaseDate, globalReleaseVersion, chinaReleaseVersion };
  });
  if (inputs.size) throw new Error(`China date input refers to unknown live skins: ${[...inputs.keys()].join(', ')}`);
  if (versions.size) throw new Error(`Version input refers to unknown live skins: ${[...versions.keys()].join(', ')}`);
  return { snapshot: parseReleaseSnapshot({ schemaVersion: 1, skins }), report };
}

async function fetchJson(url: string, fetcher: typeof fetch): Promise<unknown> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetcher(url, { headers: { 'User-Agent': 'LoLChromaArt/0.1 skin-release-import' } });
      if (!response.ok) {
        if (response.status !== 429 && response.status < 500) throw new Error(`Request failed (${response.status}): ${url}`);
        throw new TypeError(`Transient request failure (${response.status}): ${url}`);
      }
      const body = await response.text();
      return JSON.parse(body) as unknown;
    } catch (error) {
      if (attempt === 2 || !(error instanceof TypeError)) throw error;
      await new Promise((done) => setTimeout(done, 500 * (attempt + 1)));
    }
  }
  throw new Error(`Request failed: ${url}`);
}

async function atomicJson(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await rename(temporary, path);
}

export async function updateSkinReleaseDates(options: { root: string; apply?: boolean; chinaInput?: string; versionInput?: string; fetcher?: typeof fetch; today?: string }): Promise<UpdateReport> {
  const root = resolve(options.root);
  const oldPath = resolve(root, OUTPUT);
  let previousText: string | null;
  try {
    previousText = await readFile(oldPath, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    previousText = null;
  }
  const previous = previousText === null ? { schemaVersion: 1, skins: [] } : JSON.parse(previousText) as unknown;
  const chinaDates = options.chinaInput ? JSON.parse(await readFile(resolve(options.chinaInput), 'utf8')) as unknown : undefined;
  const versions = options.versionInput ? JSON.parse(await readFile(resolve(options.versionInput), 'utf8')) as unknown : undefined;
  const today = options.today ?? new Date().toISOString().slice(0, 10);
  let result: { snapshot: ReleaseSnapshot; report: UpdateReport };
  if (options.chinaInput || options.versionInput) {
    if (previousText === null) throw new Error(`Run the full update before adding China dates; missing ${OUTPUT}`);
    result = buildOfflineSnapshot(previous, chinaDates, versions, today);
  } else {
    const fetcher = options.fetcher ?? fetch;
    const [wiki, cdSkins, cdChineseSkins, cdChampions, cdChineseChampions] = await Promise.all([fetchJson(WIKI_URL, fetcher), fetchJson(SKINS_URL, fetcher), fetchJson(ZH_SKINS_URL, fetcher), fetchJson(CHAMPIONS_URL, fetcher), fetchJson(ZH_CHAMPIONS_URL, fetcher)]);
    const wikiResponse = object(wiki, 'Wiki response');
    const pages = object(object(wikiResponse.query, 'Wiki query').pages, 'Wiki pages');
    const page = object(Object.values(pages)[0], 'Wiki page');
    if (!Array.isArray(page.revisions) || page.revisions.length !== 1) throw new Error('Wiki revision missing');
    const revision = object(page.revisions[0], 'Wiki revision');
    const source = object(object(revision.slots, 'Wiki slots').main, 'Wiki main slot')['*'];
    if (typeof source !== 'string') throw new Error('Wiki Lua source missing');
    result = buildReleaseSnapshot({ wikiTable: parseLuaTable(source), cdSkins, cdChineseSkins, cdChampions, cdChineseChampions, previous, today });
  }
  const { snapshot, report } = result;
  await atomicJson(resolve(root, REPORT), report);
  if (report.disappearedFromCd.length) throw new Error(`Skin release update needs review; see ${REPORT}`);
  const candidateText = `${JSON.stringify(snapshot, null, 2)}\n`;
  if (options.apply) {
    let reviewed: string;
    try {
      reviewed = await readFile(resolve(root, CANDIDATE), 'utf8');
    } catch {
      throw new Error(`Run a preview before --apply; expected ${CANDIDATE}`);
    }
    if (reviewed !== candidateText) throw new Error('Sources or local data changed since preview; run a new preview');
  } else {
    await atomicJson(resolve(root, CANDIDATE), snapshot);
  }
  if (options.apply && previousText !== candidateText) await atomicJson(oldPath, snapshot);
  return report;
}

async function cli(): Promise<void> {
  const args = process.argv.slice(2);
  const inputIndex = args.indexOf('--china-input');
  const chinaInput = inputIndex < 0 ? undefined : args[inputIndex + 1];
  const versionIndex = args.indexOf('--version-input');
  const versionInput = versionIndex < 0 ? undefined : args[versionIndex + 1];
  if (inputIndex >= 0 && !chinaInput || versionIndex >= 0 && !versionInput) throw new Error('Usage: pnpm skin-dates:update [--apply] [--china-input path.json] [--version-input path.json]');
  const report = await updateSkinReleaseDates({ root: process.cwd(), apply: args.includes('--apply'), chinaInput, versionInput });
  console.log(JSON.stringify({ applied: args.includes('--apply'), reportPath: REPORT, counts: Object.fromEntries(Object.entries(report).map(([key, items]) => [key, items.length])) }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) cli().catch((error) => { console.error(error); process.exitCode = 1; });
