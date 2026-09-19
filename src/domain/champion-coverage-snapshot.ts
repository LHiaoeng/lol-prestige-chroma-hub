import { z } from "zod";
import type { ChampionCoverageSnapshot } from "./champion-coverage";

const officialSummaryUrl = z
  .string()
  .url()
  .refine(
    (value) =>
      value.startsWith(
        "https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/",
      ) && value.endsWith("/v1/champion-summary.json"),
    "Champion coverage source must be an official PBE summary URL",
  );

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
      portraitUrl: z.string().url(),
    }),
  ),
});

const repositorySnapshotSchema = z.object({
  schemaVersion: z.literal(1),
  source: z.object({
    channel: z.literal("pbe"),
    locales: z.tuple([z.literal("default"), z.literal("zh_cn")]),
    urls: z.object({
      default: officialSummaryUrl,
      zh_cn: officialSummaryUrl,
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
  return parsed;
}
