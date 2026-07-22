# Dynamic Champion Coverage Blog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the newest blog article from current bilingual CommunityDragon champion summaries and refresh every visible coverage fact in the browser without exposing the private prestige chroma catalog.

**Architecture:** Pure domain functions normalize CommunityDragon asset paths, validate and join English/Chinese champion summaries, calculate coverage, and generate all variable copy. Astro fetches both summaries at build time for complete SEO HTML; a small client adapter repeats the fetch after page load and atomically replaces marked text and lists while preserving the static snapshot on failure.

**Tech Stack:** Astro 7 static output, TypeScript strict, Zod 4, Vitest 4, browser Fetch/DOM APIs, pnpm.

**Version control constraint:** The repository instructions prohibit implementation commits without an explicit user request. Each task ends with a diff checkpoint; leave implementation changes uncommitted unless the user separately asks for a commit.

---

### Task 1: CommunityDragon URL conversion utility

**Files:**
- Create: `src/domain/communitydragon-url.ts`
- Test: `src/domain/communitydragon-url.test.ts`

- [ ] **Step 1: Write failing URL normalization tests**

```ts
import { describe, expect, it } from 'vitest';
import {
  COMMUNITYDRAGON_CHAMPION_SUMMARY_URLS,
  communityDragonAssetUrl,
} from './communitydragon-url';

describe('CommunityDragon URL conversion', () => {
  it('converts game asset and plugin paths to normalized latest URLs', () => {
    expect(communityDragonAssetUrl('/lol-game-data/assets/ASSETS/Characters/Annie/Icon.PNG')).toBe(
      'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/characters/annie/icon.png',
    );
    expect(communityDragonAssetUrl('plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/1.png')).toBe(
      'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/1.png',
    );
  });

  it('normalizes recognized full raw URLs through the same converter', () => {
    expect(communityDragonAssetUrl('https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/1.png')).toBe(
      'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/1.png',
    );
  });

  it.each(['', '   ', '../secret.png', 'assets/../secret.png', String.raw`assets\\icon.png`, 'https://example.com/icon.png'])(
    'rejects unsafe asset input %j',
    (input) => expect(() => communityDragonAssetUrl(input)).toThrow(),
  );

  it('defines the approved bilingual summary endpoints', () => {
    expect(COMMUNITYDRAGON_CHAMPION_SUMMARY_URLS).toEqual({
      en: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-summary.json',
      zh: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/zh_cn/v1/champion-summary.json',
    });
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm vitest run src/domain/communitydragon-url.test.ts`

Expected: FAIL because `communitydragon-url.ts` does not exist.

- [ ] **Step 3: Implement strict normalization**

```ts
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
```

- [ ] **Step 4: Run the URL tests and verify GREEN**

Run: `pnpm vitest run src/domain/communitydragon-url.test.ts`

Expected: PASS with all URL and rejection cases green.

- [ ] **Step 5: Audit the utility diff**

```powershell
git diff --check -- src/domain/communitydragon-url.ts src/domain/communitydragon-url.test.ts
git diff --stat -- src/domain/communitydragon-url.ts src/domain/communitydragon-url.test.ts
```

Expected: no whitespace errors and only the utility plus its test are listed.

### Task 2: Bilingual champion coverage domain model

**Files:**
- Create: `src/domain/champion-coverage.ts`
- Test: `src/domain/champion-coverage.test.ts`

- [ ] **Step 1: Write failing bilingual coverage tests**

```ts
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
    expect(snapshot).toMatchObject({ totalChampions: 2, coveredChampions: 1, missingChampions: 1, coveragePercent: 50, patchVersion: '26.14' });
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

  it('generates every variable sentence from one snapshot', () => {
    const copy = championCoverageCopy(buildChampionCoverage(en, zh, ['2'], '26.14'));
    expect(copy.deckEn).toContain('1 out of 2');
    expect(copy.deckZh).toContain('2 位英雄中已有 1 位');
    expect(copy.listIntroEn).toContain('A–Z');
    expect(copy.coverageValue).toBe('50%');
  });

  it('selects the highest dotted game version', () => {
    expect(latestGameVersion(['26.9', '26.14', '25.24'])).toBe('26.14');
  });
});
```

- [ ] **Step 2: Run the domain test and verify RED**

Run: `pnpm vitest run src/domain/champion-coverage.test.ts`

Expected: FAIL because the coverage module does not exist.

- [ ] **Step 3: Implement schemas, joins, calculation, and copy**

Define these exported contracts in `src/domain/champion-coverage.ts`:

```ts
import { z } from 'zod';
import { communityDragonAssetUrl } from './communitydragon-url';

const championSummaryRecordSchema = z.object({
  id: z.number().int(),
  name: z.string().trim(),
  description: z.string().trim(),
  alias: z.string().trim().min(1),
  squarePortraitPath: z.string().trim().min(1),
});
const championSummarySchema = z.array(championSummaryRecordSchema);

export interface MissingChampion {
  readonly id: string;
  readonly alias: string;
  readonly nameEn: string;
  readonly nameZh: string;
  readonly portraitUrl: string;
}

export interface ChampionCoverageSnapshot {
  readonly patchVersion: string;
  readonly totalChampions: number;
  readonly coveredChampions: number;
  readonly missingChampions: number;
  readonly coveragePercent: number;
  readonly champions: readonly MissingChampion[];
}

export interface ChampionCoverageCopy {
  readonly deckEn: string;
  readonly deckZh: string;
  readonly captionEn: string;
  readonly captionZh: string;
  readonly overviewEn: string;
  readonly overviewZh: string;
  readonly listIntroEn: string;
  readonly listIntroZh: string;
  readonly totalValue: string;
  readonly coveredValue: string;
  readonly missingValue: string;
  readonly coverageValue: string;
}
```

Implement parsing and calculation with these concrete operations:

```ts
type SummaryRecord = z.infer<typeof championSummaryRecordSchema>;

function positiveSummary(input: unknown, label: string): SummaryRecord[] {
  const records = championSummarySchema.parse(input).filter((record) => record.id > 0);
  if (records.length === 0) throw new Error(`${label} champion summary is empty`);
  const ids = new Set<number>();
  for (const record of records) {
    if (ids.has(record.id)) throw new Error(`Duplicate ${label} champion ID: ${record.id}`);
    ids.add(record.id);
  }
  return records;
}

export function buildChampionCoverage(
  englishInput: unknown,
  chineseInput: unknown,
  coveredHeroIds: readonly string[],
  patchVersion: string,
): ChampionCoverageSnapshot {
  if (!/^\d{1,2}\.\d{1,2}$/.test(patchVersion)) throw new Error('Invalid patch version');
  const english = positiveSummary(englishInput, 'English');
  const chinese = positiveSummary(chineseInput, 'Chinese');
  const englishIds = new Set(english.map((record) => String(record.id)));
  const covered = new Set(coveredHeroIds);
  for (const id of covered) {
    if (!englishIds.has(id)) throw new Error(`Unknown covered champion ID: ${id}`);
  }
  const chineseById = new Map(chinese.map((record) => [record.id, record]));
  const champions = english
    .filter((record) => !covered.has(String(record.id)))
    .map((record) => ({
      id: String(record.id),
      alias: record.alias,
      nameEn: record.name,
      nameZh: chineseById.get(record.id)?.description || record.name,
      portraitUrl: communityDragonAssetUrl(record.squarePortraitPath),
    }))
    .sort((left, right) => left.nameEn.localeCompare(right.nameEn, 'en', { sensitivity: 'base' }));
  const coveredChampions = english.length - champions.length;
  return {
    patchVersion,
    totalChampions: english.length,
    coveredChampions,
    missingChampions: champions.length,
    coveragePercent: Number(((coveredChampions / english.length) * 100).toFixed(1)),
    champions,
  };
}

export function championCoverageCopy(snapshot: ChampionCoverageSnapshot): ChampionCoverageCopy {
  const { patchVersion, totalChampions, coveredChampions, missingChampions, coveragePercent } = snapshot;
  return {
    deckEn: `As of Patch ${patchVersion}, ${coveredChampions} out of ${totalChampions} champions have received prestige chroma splash art. Here are the ${missingChampions} still waiting.`,
    deckZh: `截至 ${patchVersion} 版本，${totalChampions} 位英雄中已有 ${coveredChampions} 位获得臻彩原画，还有 ${missingChampions} 位仍在等待。`,
    captionEn: `The Prestige Chroma Collection — ${coveredChampions} champions and counting.`,
    captionZh: `臻彩藏馆——已有 ${coveredChampions} 位英雄入选。`,
    overviewEn: `Patch ${patchVersion} brings the total to ${coveredChampions} covered champions, leaving ${missingChampions} without prestige chroma splash art.`,
    overviewZh: `${patchVersion} 版本中已有 ${coveredChampions} 位英雄入选，还有 ${missingChampions} 位暂未获得臻彩原画。`,
    listIntroEn: `${missingChampions} champions, sorted by English champion name A–Z:`,
    listIntroZh: `${missingChampions} 位英雄，按英文英雄名 A–Z 排列：`,
    totalValue: String(totalChampions),
    coveredValue: String(coveredChampions),
    missingValue: String(missingChampions),
    coverageValue: `${coveragePercent}%`,
  };
}

export function latestGameVersion(versions: readonly string[]): string {
  const parsed = versions.map((value) => {
    const match = /^(\d{1,2})\.(\d{1,2})$/.exec(value);
    if (!match) throw new Error(`Invalid game version: ${value}`);
    return { value, major: Number(match[1]), minor: Number(match[2]) };
  });
  if (parsed.length === 0) throw new Error('Game version list is empty');
  parsed.sort((left, right) => right.major - left.major || right.minor - left.minor);
  return parsed[0].value;
}
```

- [ ] **Step 4: Run both domain suites and verify GREEN**

Run: `pnpm vitest run src/domain/communitydragon-url.test.ts src/domain/champion-coverage.test.ts`

Expected: PASS.

- [ ] **Step 5: Audit the coverage-model diff**

```powershell
git diff --check -- src/domain/champion-coverage.ts src/domain/champion-coverage.test.ts
git diff --stat -- src/domain/champion-coverage.ts src/domain/champion-coverage.test.ts
```

Expected: no whitespace errors and only the domain model plus its test are listed.

### Task 3: Build-time and browser data adapters

**Files:**
- Create: `src/data/champion-coverage.ts`
- Create: `src/data/champion-coverage.test.ts`
- Create: `src/client/champion-coverage-refresh.ts`
- Create: `src/client/champion-coverage-refresh.test.ts`

- [ ] **Step 1: Write failing adapter tests**

```ts
import { describe, expect, it, vi } from 'vitest';
import { fetchChampionCoverage } from './champion-coverage';

it('requests both localized summaries and returns one snapshot', async () => {
  const fetcher = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 1, name: 'Annie', description: 'the Dark Child', alias: 'Annie', squarePortraitPath: '/lol-game-data/assets/v1/champion-icons/1.png' }]), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 1, name: '黑暗之女', description: '安妮', alias: 'Annie', squarePortraitPath: '/lol-game-data/assets/v1/champion-icons/1.png' }]), { status: 200 }));
  await expect(fetchChampionCoverage(fetcher, [], '26.14')).resolves.toMatchObject({ totalChampions: 1, missingChampions: 1 });
  expect(fetcher).toHaveBeenCalledTimes(2);
});

it('rejects a non-successful response', async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response('', { status: 503 }));
  await expect(fetchChampionCoverage(fetcher, [], '26.14')).rejects.toThrow(/503/);
});
```

In `src/client/champion-coverage-refresh.test.ts`, test the injected apply/fallback boundary:

```ts
import { expect, it, vi } from 'vitest';
import { refreshChampionCoverage } from './champion-coverage-refresh';

it('applies a successful refresh exactly once', async () => {
  const snapshot = { patchVersion: '26.14', totalChampions: 1, coveredChampions: 0, missingChampions: 1, coveragePercent: 0, champions: [] };
  const apply = vi.fn();
  await expect(refreshChampionCoverage({ load: async () => snapshot, apply })).resolves.toBe(true);
  expect(apply).toHaveBeenCalledWith(snapshot);
});

it('preserves the snapshot when loading fails', async () => {
  const apply = vi.fn();
  const fallback = vi.fn();
  await expect(refreshChampionCoverage({ load: async () => { throw new Error('offline'); }, apply, fallback })).resolves.toBe(false);
  expect(apply).not.toHaveBeenCalled();
  expect(fallback).toHaveBeenCalledOnce();
});
```

- [ ] **Step 2: Run adapter tests and verify RED**

Run: `pnpm vitest run src/data/champion-coverage.test.ts src/client/champion-coverage-refresh.test.ts`

Expected: FAIL because both adapters are missing.

- [ ] **Step 3: Implement shared build fetch adapter**

In `src/data/champion-coverage.ts`, export:

```ts
import { buildChampionCoverage, type ChampionCoverageSnapshot } from '../domain/champion-coverage';
import { COMMUNITYDRAGON_CHAMPION_SUMMARY_URLS } from '../domain/communitydragon-url';

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export async function fetchChampionCoverage(
  fetcher: FetchLike,
  coveredHeroIds: readonly string[],
  patchVersion: string,
): Promise<ChampionCoverageSnapshot> {
  const responses = await Promise.all([
    fetcher(COMMUNITYDRAGON_CHAMPION_SUMMARY_URLS.en, { signal: AbortSignal.timeout(10_000) }),
    fetcher(COMMUNITYDRAGON_CHAMPION_SUMMARY_URLS.zh, { signal: AbortSignal.timeout(10_000) }),
  ]);
  for (const response of responses) {
    if (!response.ok) throw new Error(`CommunityDragon request failed: ${response.status}`);
  }
  const [english, chinese] = await Promise.all(responses.map((response) => response.json()));
  return buildChampionCoverage(english, chinese, coveredHeroIds, patchVersion);
}
```

- [ ] **Step 4: Implement the client refresh boundary and DOM updater**

In `src/client/champion-coverage-refresh.ts`, export `refreshChampionCoverage({ load, apply, fallback })`, `applyChampionCoverage(document, snapshot)`, and `initializeChampionCoverageRefresh(document, fetcher = fetch)`. Import `fetchChampionCoverage` and `FetchLike` from `../data/champion-coverage`; this shared adapter contains no catalog import and is safe to bundle.

`initializeChampionCoverageRefresh` must parse `#champion-coverage-config`, call both approved URLs with a 10-second timeout, calculate through `buildChampionCoverage`, and then call `applyChampionCoverage`. The updater must:

```ts
const copy = championCoverageCopy(snapshot);
document.querySelectorAll<HTMLElement>('[data-coverage-text]').forEach((element) => {
  const key = element.dataset.coverageText as keyof typeof copy;
  element.textContent = copy[key];
});

for (const list of document.querySelectorAll<HTMLUListElement>('[data-coverage-list]')) {
  const language = list.dataset.coverageList === 'zh' ? 'zh' : 'en';
  const fragment = document.createDocumentFragment();
  snapshot.champions.forEach((champion, index) => {
    const item = document.createElement('li');
    const number = document.createElement('span');
    number.className = 'champ-id';
    number.textContent = `${index + 1}.`;
    const image = document.createElement('img');
    image.className = 'champ-avatar';
    image.src = champion.portraitUrl;
    image.alt = '';
    image.width = 32;
    image.height = 32;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.setAttribute('aria-hidden', 'true');
    const name = document.createElement('span');
    name.className = 'champ-name';
    name.textContent = language === 'zh' ? champion.nameZh : champion.nameEn;
    item.append(number, image, name);
    fragment.append(item);
  });
  list.replaceChildren(fragment);
}
```

On success, set both `[data-coverage-status]` nodes to localized refreshed messages. On failure, set localized build-snapshot messages without altering any coverage text or list.

Use this initialization boundary so the fallback behavior remains testable:

```ts
export async function refreshChampionCoverage(options: {
  load: () => Promise<ChampionCoverageSnapshot>;
  apply: (snapshot: ChampionCoverageSnapshot) => void;
  fallback?: () => void;
}): Promise<boolean> {
  try {
    const snapshot = await options.load();
    options.apply(snapshot);
    return true;
  } catch {
    options.fallback?.();
    return false;
  }
}

export function initializeChampionCoverageRefresh(document: Document, fetcher: FetchLike = fetch): Promise<boolean> {
  const configElement = document.querySelector<HTMLScriptElement>('#champion-coverage-config');
  if (!configElement?.textContent) return Promise.resolve(false);
  const value: unknown = JSON.parse(configElement.textContent);
  if (!value || typeof value !== 'object' || !Array.isArray((value as { coveredHeroIds?: unknown }).coveredHeroIds)
    || typeof (value as { patchVersion?: unknown }).patchVersion !== 'string') return Promise.resolve(false);
  const config = value as { coveredHeroIds: string[]; patchVersion: string };
  return refreshChampionCoverage({
    load: () => fetchChampionCoverage(fetcher, config.coveredHeroIds, config.patchVersion),
    apply: (snapshot) => {
      applyChampionCoverage(document, snapshot);
      setCoverageStatus(document, 'Live data refreshed from CommunityDragon.', '已从 CommunityDragon 刷新实时数据。');
    },
    fallback: () => setCoverageStatus(document, 'Live refresh unavailable; showing the build snapshot.', '实时刷新暂不可用，当前显示构建快照。'),
  });
}
```

- [ ] **Step 5: Run adapter and domain tests and verify GREEN**

Run: `pnpm vitest run src/domain/communitydragon-url.test.ts src/domain/champion-coverage.test.ts src/data/champion-coverage.test.ts src/client/champion-coverage-refresh.test.ts`

Expected: PASS.

- [ ] **Step 6: Audit both adapter diffs**

```powershell
git diff --check -- src/data/champion-coverage.ts src/data/champion-coverage.test.ts src/client/champion-coverage-refresh.ts src/client/champion-coverage-refresh.test.ts
git diff --stat -- src/data/champion-coverage.ts src/data/champion-coverage.test.ts src/client/champion-coverage-refresh.ts src/client/champion-coverage-refresh.test.ts
```

Expected: no whitespace errors and only the four adapter files are listed.

### Task 4: Replace the hard-coded article data

**Files:**
- Modify: `scripts/blog-feature.test.ts`
- Modify: `scripts/site-build.test.ts`
- Modify: `src/pages/blog/champions-without-prestige-chroma.astro`

- [ ] **Step 1: Add a failing page source contract**

Append a test that requires the dynamic bindings and bans stale source literals:

```ts
it('derives and refreshes every champion coverage fact', () => {
  const page = source('src/pages/blog/champions-without-prestige-chroma.astro');
  expect(page).toContain("fetchChampionCoverage(fetch, coveredHeroIds, patchVersion)");
  expect(page).toContain('championCoverageCopy(snapshot)');
  expect(page).toContain('id="champion-coverage-config"');
  expect(page).toContain('initializeChampionCoverageRefresh(document)');
  expect(page.match(/data-coverage-list="(?:en|zh)"/g)).toHaveLength(2);
  expect(page.match(/data-coverage-status/g)).toHaveLength(2);
  for (const key of ['deckEn', 'deckZh', 'captionEn', 'captionZh', 'overviewEn', 'overviewZh', 'listIntroEn', 'listIntroZh', 'totalValue', 'coveredValue', 'missingValue', 'coverageValue']) {
    expect(page).toContain(`data-coverage-text="${key}"`);
  }
  for (const stale of ['Patch 26.14', '173 champions', '68 champions', '>60.7%</span>', '按上线时间从早到晚排列']) {
    expect(page).not.toContain(stale);
  }
  expect(page).not.toContain('/img/champions/${c.alias}.png');
  expect(page).not.toContain('prestige-chromas.json');
});
```

In `scripts/site-build.test.ts`, read the built coverage article and add the artifact contract before changing the page:

```ts
const coverageArticle = readFileSync(join(dist, 'blog', 'champions-without-prestige-chroma', 'index.html'), 'utf8');
expect(coverageArticle).toContain('<link rel="canonical" href="https://chromaart.lol/blog/champions-without-prestige-chroma/">');
expect(coverageArticle).toContain('data-coverage-list="en"');
expect(coverageArticle).toContain('data-coverage-list="zh"');
expect(coverageArticle).toContain('id="champion-coverage-config"');
expect(coverageArticle).toContain('https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/');
expect(coverageArticle).toContain('按英文英雄名 A–Z 排列');
expect(coverageArticle).not.toContain('prestige-chromas.json');
expect(coverageArticle).not.toContain('按上线时间从早到晚排列');
const configJson = coverageArticle.match(/<script[^>]*id="champion-coverage-config"[^>]*>([\s\S]*?)<\/script>/)?.[1];
expect(configJson).toBeDefined();
expect(Object.keys(JSON.parse(configJson!)).sort()).toEqual(['coveredHeroIds', 'patchVersion']);
```

- [ ] **Step 2: Run the page contract and verify RED**

Run: `pnpm vitest run scripts/blog-feature.test.ts scripts/site-build.test.ts`

Expected: FAIL on missing fetch, bindings, config, and stale hard-coded facts.

- [ ] **Step 3: Build the snapshot in Astro frontmatter**

Remove the hard-coded `champions` array. Import `catalog`, `fetchChampionCoverage`, `latestGameVersion`, `championCoverageCopy`, and `safeJsonLd`. Derive:

```ts
const coveredHeroIds = [...new Set(catalog.map((item) => item.heroId))];
const patchVersion = latestGameVersion(catalog.map((item) => item.gameVer));
const snapshot = await fetchChampionCoverage(fetch, coveredHeroIds, patchVersion);
const coverageCopy = championCoverageCopy(snapshot);
const clientConfig = safeJsonLd({ coveredHeroIds, patchVersion });
```

- [ ] **Step 4: Bind all visible variable copy and both lists**

Replace fixed data sentences with spans or complete elements keyed by `data-coverage-text`. Preserve the internal guide links by limiting `overviewEn` and `overviewZh` to the variable sentence after each link-bearing sentence. Render each static list from `snapshot.champions`, using `champion.portraitUrl`, `nameEn` in the English article, and `nameZh` in the Chinese article.

Use these list declarations:

```astro
<ul class="champion-list" data-coverage-list="en">
  {snapshot.champions.map((champion, index) => (
    <li><span class="champ-id">{index + 1}.</span><img class="champ-avatar" src={champion.portraitUrl} alt="" width="32" height="32" loading="lazy" decoding="async" aria-hidden="true" /><span class="champ-name">{champion.nameEn}</span></li>
  ))}
</ul>
```

Render the equivalent `data-coverage-list="zh"` list with `champion.nameZh`. Add one `aria-live="polite" data-coverage-status` paragraph to each language article. Serialize only `{ coveredHeroIds, patchVersion }` in `#champion-coverage-config`, then initialize the client module from an Astro-bundled `<script>`.

- [ ] **Step 5: Run page, build-artifact, and focused domain tests and verify GREEN**

Run: `pnpm vitest run scripts/blog-feature.test.ts scripts/site-build.test.ts src/domain/champion-coverage.test.ts src/client/champion-coverage-refresh.test.ts`

Expected: PASS.

- [ ] **Step 6: Audit the page integration**

```powershell
git diff --check -- scripts/blog-feature.test.ts scripts/site-build.test.ts src/pages/blog/champions-without-prestige-chroma.astro
git diff --stat -- scripts/blog-feature.test.ts scripts/site-build.test.ts src/pages/blog/champions-without-prestige-chroma.astro
```

Expected: no whitespace errors; the existing promoted article is modified in place and draft files are not restored.

### Task 5: Remove stale metadata and document the update path

**Files:**
- Modify: `src/blog/articles.test.ts`
- Modify: `src/blog/articles.ts`
- Modify: `README.md`
- Modify: `docs/frontend-design.md`
- Modify: `docs/数据源与JSON结构.md`

- [ ] **Step 1: Add a failing count-free metadata test**

```ts
it('keeps live coverage article metadata free of stale counts and patch numbers', () => {
  const article = blogArticles.find((item) => item.slug === 'champions-without-prestige-chroma');
  expect(article).toBeDefined();
  expect(article!.summaryEn).toBe('A live League of Legends tracker showing every champion that still lacks prestige chroma splash art.');
  expect(article!.summaryZh).toBe('动态追踪《英雄联盟》中仍未获得臻彩原画的全部英雄。');
  expect(`${article!.summaryEn} ${article!.summaryZh}`).not.toMatch(/26\.14|173|105|68|60\.7/);
});
```

- [ ] **Step 2: Run the metadata test and verify RED**

Run: `pnpm vitest run src/blog/articles.test.ts`

Expected: FAIL because the current summary contains Patch 26.14 and 68.

- [ ] **Step 3: Replace the two summaries and fix existing index expectations**

Update only the newest article's `summaryEn` and `summaryZh` to the exact strings asserted above. Preserve its publication date, title, canonical route, cover, and newest-first position. Correct the already-edited article metadata test so its index assertions consistently expect `champions-without-prestige-chroma` at index 0 and the existing articles at indexes 1–3.

- [ ] **Step 4: Document build and runtime behavior**

Add concise sections stating:

```markdown
- The newest coverage article fetches CommunityDragon `default` and `zh_cn` champion summaries during Astro builds.
- The browser repeats those requests after page load; CORS is provided by `raw.communitydragon.org`.
- CommunityDragon asset paths are converted only by `src/domain/communitydragon-url.ts`.
- The public page embeds covered hero IDs and the local patch label, never `data/prestige-chromas.json`.
- Build fetch or validation failures stop a release; runtime failures preserve the complete static snapshot.
```

Merge these notes into the nearest existing data/build and frontend architecture sections rather than duplicating whole documents. Preserve unrelated working-tree edits in `README.md` and `docs/frontend-design.md`.

- [ ] **Step 5: Run metadata tests and documentation checks**

Run: `pnpm vitest run src/blog/articles.test.ts scripts/blog-feature.test.ts`

Expected: PASS.

Run: `git diff --check`

Expected: exit 0; line-ending conversion warnings are acceptable, whitespace errors are not.

- [ ] **Step 6: Audit metadata and documentation changes**

```powershell
git diff --check -- src/blog/articles.ts src/blog/articles.test.ts README.md docs/frontend-design.md docs/数据源与JSON结构.md
git diff --stat -- src/blog/articles.ts src/blog/articles.test.ts README.md docs/frontend-design.md docs/数据源与JSON结构.md
```

Expected: no whitespace errors. Re-read the mixed diffs in `README.md` and `docs/frontend-design.md` to ensure pre-existing edits were preserved.

### Task 6: Verify the release artifact and privacy boundary

**Files:**
- Verify only; make corrections in the file that owns any observed failure.

- [ ] **Step 1: Run all focused tests**

Run: `pnpm vitest run src/domain/communitydragon-url.test.ts src/domain/champion-coverage.test.ts src/data/champion-coverage.test.ts src/client/champion-coverage-refresh.test.ts src/blog/articles.test.ts scripts/blog-feature.test.ts scripts/site-build.test.ts`

Expected: all selected test files PASS.

- [ ] **Step 2: Run type checking**

Run: `pnpm typecheck`

Expected: Astro and TypeScript report zero errors.

- [ ] **Step 3: Validate private catalog data**

Run: `pnpm data:validate`

Expected: the complete prestige chroma catalog passes validation.

- [ ] **Step 4: Run the full release build**

Run: `pnpm release:build`

Expected: all Vitest suites, Astro checks, catalog validation, static build, and build audit pass. The build output contains the complete bilingual coverage article before JavaScript runs.

- [ ] **Step 5: Inspect the release artifact privacy boundary**

Run:

```powershell
$html = Get-Content -Raw -Encoding UTF8 -LiteralPath 'dist\blog\champions-without-prestige-chroma\index.html'
([regex]::Matches($html, 'data-coverage-list="(?:en|zh)"')).Count
$html.Contains('prestige-chromas.json')
```

Expected: list count is `2`, and the private catalog filename check is `False`.

- [ ] **Step 6: Audit the final diff without committing**

Run:

```powershell
git diff --check
git status --short
git diff --stat
```

Confirm that unrelated existing changes and untracked files remain untouched. Leave all implementation changes uncommitted until the user explicitly requests a commit.
