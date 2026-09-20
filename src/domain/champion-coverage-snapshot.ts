import { z } from "zod";
import type { ChampionCoverageSnapshot } from "./champion-coverage";

const RAW_ORIGIN = "https://raw.communitydragon.org";

function officialSummaryUrl(locale: "default" | "zh_cn") {
  return z.string().url().refine((value) => {
    const url = new URL(value);
    return (
      url.origin === RAW_ORIGIN &&
      url.pathname ===
        `/pbe/plugins/rcp-be-lol-game-data/global/${locale}/v1/champion-summary.json` &&
      !url.search &&
      !url.hash
    );
  }, "Champion coverage source must be an official `pbe` summary URL");
}

const officialPortraitUrl = z.string().url().refine((value) => {
  const url = new URL(value);
  return (
    url.origin === RAW_ORIGIN &&
    /^\/pbe\/plugins\/rcp-be-lol-game-data\/global\/default\/v1\/champion-icons\/[1-9]\d*\.png$/.test(
      url.pathname,
    ) &&
    !url.search &&
    !url.hash
  );
}, "Champion portrait must be an official `pbe` champion icon URL");

const snapshotSchema = z.object({
  patchVersion: z.string().regex(/^\d{1,2}\.\d{1,2}$/),
  totalChampions: z.number().int().positive(),
  coveredChampions: z.number().int().nonnegative(),
  missingChampions: z.number().int().nonnegative(),
  coveragePercent: z.number().finite().nonnegative(),
  champions: z.array(
    z.object({
      id: z.string().regex(/^[1-9]\d*$/),
      alias: z.string().min(1),
      nameEn: z.string().min(1),
      nameZh: z.string().min(1),
      portraitUrl: officialPortraitUrl,
    }),
  ),
});

const repositorySnapshotSchema = z.object({
  schemaVersion: z.literal(1),
  source: z.object({
    channel: z.literal("pbe"),
    locales: z.tuple([z.literal("default"), z.literal("zh_cn")]),
    urls: z.object({
      default: officialSummaryUrl("default"),
      zh_cn: officialSummaryUrl("zh_cn"),
    }),
    fetchedAt: z.string().datetime({ offset: true }),
    contentVersion: z.string().min(1),
  }),
  snapshot: snapshotSchema,
});

export interface ChampionCoverageRepositorySnapshot {
  readonly schemaVersion: 1;
  readonly source: {
    readonly channel: "pbe";
    readonly locales: readonly ["default", "zh_cn"];
    readonly urls: {
      readonly default: string;
      readonly zh_cn: string;
    };
    readonly fetchedAt: string;
    readonly contentVersion: string;
  };
  readonly snapshot: ChampionCoverageSnapshot;
}

export function parseChampionCoverageRepositorySnapshot(
  input: unknown,
): ChampionCoverageRepositorySnapshot {
  const parsed = repositorySnapshotSchema.parse(input);
  const { snapshot } = parsed;
  if (
    snapshot.coveredChampions + snapshot.missingChampions !==
    snapshot.totalChampions
  )
    throw new Error("Champion coverage snapshot counts do not add up");
  if (snapshot.champions.length !== snapshot.missingChampions)
    throw new Error("Champion coverage snapshot list count is inconsistent");
  const expectedCoverage = Number(
    ((snapshot.coveredChampions / snapshot.totalChampions) * 100).toFixed(1),
  );
  if (snapshot.coveragePercent !== expectedCoverage)
    throw new Error("Champion coverage percentage is inconsistent");
  return parsed;
}
