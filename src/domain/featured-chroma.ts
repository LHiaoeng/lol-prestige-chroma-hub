export function selectFeaturedChroma<T extends { isNew: boolean }>(catalog: T[]): T | undefined {
  return catalog.find((item) => item.isNew) ?? catalog[0];
}
