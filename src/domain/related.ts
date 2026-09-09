import type { Chroma } from './chroma';

export interface RelatedGroup {
  kind: 'hero' | 'skinSet' | 'universe' | 'version';
  titleEn: string;
  titleZh: string;
  chromas: Chroma[];
}

function sortByRankProximity(current: Chroma): (left: Chroma, right: Chroma) => number {
  return (left, right) => Math.abs(left.rank - current.rank) - Math.abs(right.rank - current.rank)
    || right.rank - left.rank
    || left.skinId - right.skinId;
}

function heroShortNameEn(heroNameEn: string): string {
  const withoutThe = heroNameEn.replace(/^[Tt]he\s+/, '');
  const parts = withoutThe.trim().split(/\s+/);
  return parts[parts.length - 1] ?? heroNameEn;
}

function heroShortNameZh(heroNameZh: string): string {
  const parts = heroNameZh.trim().split(/\s+/);
  return parts[parts.length - 1] ?? heroNameZh;
}

export function findRelatedGroups(
  catalog: Chroma[],
  current: Chroma,
  limitPerGroup = Infinity,
): RelatedGroup[] {
  const shownSlugs = new Set<string>([current.slug]);
  const sorter = sortByRankProximity(current);
  const take = (candidates: Chroma[]) => candidates
    .filter((candidate) => !shownSlugs.has(candidate.slug))
    .sort(sorter)
    .slice(0, Math.max(0, limitPerGroup));

  const groups: RelatedGroup[] = [];

  // 1. 英雄
  const sameHero = take(catalog.filter((candidate) => candidate.heroId === current.heroId));
  if (sameHero.length > 0) {
    sameHero.forEach((candidate) => shownSlugs.add(candidate.slug));
    groups.push({
      kind: 'hero',
      titleEn: `More ${heroShortNameEn(current.heroNameEn)} Prestige Chromas`,
      titleZh: `更多${heroShortNameZh(current.heroNameZh)}臻彩`,
      chromas: sameHero,
    });
  }

  // 2. 皮肤系列
  const currentSkinSet = current.skinSets[0];
  if (currentSkinSet) {
    const sameSet = take(catalog.filter((candidate) => candidate.skinSets.some((set) => set.id === currentSkinSet.id)));
    if (sameSet.length > 0) {
      sameSet.forEach((candidate) => shownSlugs.add(candidate.slug));
      groups.push({
        kind: 'skinSet',
        titleEn: `More ${currentSkinSet.nameEn} Prestige Chromas`,
        titleZh: `更多${currentSkinSet.nameZh}臻彩`,
        chromas: sameSet,
      });
    }
  }

  // 3. 宇宙
  const currentUniverse = current.universes[0];
  if (currentUniverse) {
    const sameUniverse = take(catalog.filter((candidate) => candidate.universes.some((universe) => universe.id === currentUniverse.id)));
    if (sameUniverse.length > 0) {
      sameUniverse.forEach((candidate) => shownSlugs.add(candidate.slug));
      groups.push({
        kind: 'universe',
        titleEn: `More ${currentUniverse.nameEn} Prestige Chromas`,
        titleZh: `更多${currentUniverse.nameZh}臻彩`,
        chromas: sameUniverse,
      });
    }
  }

  // 4. 版本
  const sameVersion = take(catalog.filter((candidate) => candidate.gameVer === current.gameVer));
  if (sameVersion.length > 0) {
    sameVersion.forEach((candidate) => shownSlugs.add(candidate.slug));
    groups.push({
      kind: 'version',
      titleEn: `More Patch ${current.gameVer} Prestige Chromas`,
      titleZh: `更多${current.gameVer}版本臻彩`,
      chromas: sameVersion,
    });
  }

  return groups;
}
