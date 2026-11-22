export function adjacentDetailItem<T>(items: readonly T[], index: number, direction: -1 | 1): T | undefined {
  if (items.length < 2 || index < 0 || index >= items.length) return undefined;
  return items[(index + direction + items.length) % items.length];
}
