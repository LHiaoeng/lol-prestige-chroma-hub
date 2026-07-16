import type { Chroma } from './chroma';

function relationIds(items: Chroma['skinSets']): Set<number> {
  return new Set(items.map((item) => item.id));
}

export function findRelatedChromas(catalog: Chroma[], current: Chroma, limit = 6): Chroma[] {
  const currentSkinSets = relationIds(current.skinSets);
  const currentUniverses = relationIds(current.universes);
  const priority = (candidate: Chroma): number => {
    if (candidate.sourceSkinId === current.sourceSkinId) return 0;
    if (candidate.heroId === current.heroId) return 1;
    if (candidate.gameVer === current.gameVer) return 2;
    if (candidate.skinSets.some((item) => currentSkinSets.has(item.id))) return 3;
    if (candidate.universes.some((item) => currentUniverses.has(item.id))) return 4;
    return 5;
  };

  return catalog
    .filter((candidate) => candidate.slug !== current.slug)
    .sort((left, right) => priority(left) - priority(right)
      || Math.abs(left.rank - current.rank) - Math.abs(right.rank - current.rank)
      || right.rank - left.rank
      || left.skinId - right.skinId)
    .slice(0, Math.max(0, limit));
}
