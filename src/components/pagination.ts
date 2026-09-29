/**
 * 分页页码列表生成。
 *
 * 输出形如 [1, 2, 3, 4, 5, '...', 10] 的数组，用于 Pagination.astro 渲染。
 * - 当总页数较少（≤ 7）时直接列出全部页码，不出现省略号。
 * - 当当前页靠近开头/结尾时，仅在远端出现一个省略号。
 * - 中段位置时两端均出现省略号。
 *
 * 省略号仅在被跳过的页码数 ≥ 2 时出现，避免 [1, '...', 3] 这种浪费。
 */

export type PageEntry = number | '...';

const COMPACT_LIMIT = 7;

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export function buildPages(current: number, total: number): PageEntry[] {
  if (!Number.isInteger(total) || total <= 0) return [];
  if (!Number.isInteger(current) || current <= 0) return buildPages(1, total);
  if (current > total) return buildPages(total, total);

  if (total === 1) return [1];
  if (total <= COMPACT_LIMIT) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: PageEntry[] = [1];
  const trailingStart = total - 3;

  if (current <= 4) {
    // 靠近开头：列出 2..5，再追加省略号与末页。
    pages.push(2, 3, 4, 5, '...', total);
  } else if (current >= trailingStart) {
    // 靠近结尾：开头省略号，再列出倒数第 5 到末页，与开头窗口对称。
    pages.push('...', total - 4, total - 3, total - 2, total - 1, total);
  } else {
    // 中段：两端省略号，仅展示当前页前后各一页。
    pages.push('...', current - 1, current, current + 1, '...', total);
  }

  return pages;
}

/** 便于调用方决定 prev/next 链接是否可用的工具函数。 */
export function clampPage(value: number, total: number): number {
  if (!Number.isInteger(total) || total <= 0) return 1;
  return clamp(value, 1, total);
}
