export const TFT_ARENA_BATCH_LIMIT = 50;

export function arenaPageSize(columns: number): number {
  if (!Number.isSafeInteger(columns) || columns < 1 || columns > TFT_ARENA_BATCH_LIMIT)
    throw new Error("Arena grid column count is invalid");
  return Math.floor(TFT_ARENA_BATCH_LIMIT / columns) * columns;
}

export function arenaVisibleCount(rows: number, columns: number, total: number): number {
  if (!Number.isSafeInteger(rows) || rows < 0 || !Number.isSafeInteger(total) || total < 0)
    throw new Error("Arena pagination state is invalid");
  arenaPageSize(columns);
  return Math.min(total, rows * columns);
}
