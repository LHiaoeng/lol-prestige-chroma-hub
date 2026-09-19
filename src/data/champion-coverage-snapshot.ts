import rawSnapshot from "../../data/champion-coverage.snapshot.json";
import {
  parseChampionCoverageRepositorySnapshot,
  type ChampionCoverageRepositorySnapshot,
} from "../domain/champion-coverage-snapshot";

export const championCoverageRepositorySnapshot: ChampionCoverageRepositorySnapshot =
  parseChampionCoverageRepositorySnapshot(rawSnapshot);
