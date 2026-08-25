export const AD_PLACEMENTS = ['catalog-index', 'editorial-article'] as const;
export type AdPlacement = typeof AD_PLACEMENTS[number];

export function canDisplayAds(placement: AdPlacement, editorialArticle = false): boolean {
  return placement === 'catalog-index' || (placement === 'editorial-article' && editorialArticle);
}
