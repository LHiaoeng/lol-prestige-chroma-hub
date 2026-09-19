import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { catalog } from "../src/data/catalog";
import { buildChampionCoverage, latestGameVersion } from "../src/domain/champion-coverage";
import {
  parseChampionCoverageRepositorySnapshot,
} from "../src/domain/champion-coverage-snapshot";
import { communityDragonDataUrl } from "../src/domain/communitydragon-url";

const outputPath = resolve(process.cwd(), "data/champion-coverage.snapshot.json");
const sourceUrls = {
  default: communityDragonDataUrl("champion-summary.json", "default", "pbe"),
  zh_cn: communityDragonDataUrl("champion-summary.json", "zh_cn", "pbe"),
} as const;

async function readSummary(url: string): Promise<{ value: unknown; version: string }> {
  const response = await fetch(url, {
    credentials: "omit",
    referrerPolicy: "no-referrer",
  });
  if (!response.ok) throw new Error(`Champion summary request failed (${response.status}): ${url}`);
  const version = response.headers.get("etag") ?? response.headers.get("last-modified");
  if (!version) throw new Error(`Champion summary has no auditable content version: ${url}`);
  return { value: await response.json(), version };
}

const fetchedAt = new Date().toISOString();
const [english, chinese] = await Promise.all([
  readSummary(sourceUrls.default),
  readSummary(sourceUrls.zh_cn),
]);
const patchVersion = latestGameVersion(catalog.map((item) => item.gameVer));
const coverage = buildChampionCoverage(
  english.value,
  chinese.value,
  [...new Set(catalog.map((item) => item.heroId))],
  patchVersion,
);
const snapshot = parseChampionCoverageRepositorySnapshot({
  schemaVersion: 1,
  source: {
    channel: "pbe",
    locales: ["default", "zh_cn"],
    urls: sourceUrls,
    fetchedAt,
    contentVersion: `default:${english.version};zh_cn:${chinese.version}`,
  },
  snapshot: coverage,
});

await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
console.log(`Wrote ${snapshot.snapshot.missingChampions} missing champions to ${outputPath}`);
