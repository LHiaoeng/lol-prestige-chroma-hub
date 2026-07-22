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

type SummaryRecord = z.infer<typeof championSummaryRecordSchema>;

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
