import { describe, expect, it } from 'vitest';
import { buildPages, clampPage } from './pagination';

describe('buildPages', () => {
  it('returns empty array for non-positive total', () => {
    expect(buildPages(1, 0)).toEqual([]);
    expect(buildPages(1, -3)).toEqual([]);
  });

  it('clamps non-positive current to 1', () => {
    expect(buildPages(0, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(buildPages(-2, 8)).toEqual([1, 2, 3, 4, 5, '...', 8]);
  });

  it('clamps current above total to total', () => {
    expect(buildPages(99, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(buildPages(99, 8)).toEqual([1, '...', 4, 5, 6, 7, 8]);
  });

  it('returns single page when total is 1', () => {
    expect(buildPages(1, 1)).toEqual([1]);
  });

  it('returns all pages when total is within compact limit (≤ 7)', () => {
    expect(buildPages(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(buildPages(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(buildPages(7, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('renders leading window with trailing ellipsis when current is near start', () => {
    expect(buildPages(1, 10)).toEqual([1, 2, 3, 4, 5, '...', 10]);
    expect(buildPages(4, 10)).toEqual([1, 2, 3, 4, 5, '...', 10]);
  });

  it('renders trailing window with leading ellipsis when current is near end', () => {
    expect(buildPages(10, 10)).toEqual([1, '...', 6, 7, 8, 9, 10]);
    expect(buildPages(7, 10)).toEqual([1, '...', 6, 7, 8, 9, 10]);
  });

  it('renders middle window with ellipsis on both sides', () => {
    expect(buildPages(5, 10)).toEqual([1, '...', 4, 5, 6, '...', 10]);
    expect(buildPages(6, 10)).toEqual([1, '...', 5, 6, 7, '...', 10]);
  });

  it('handles minimum total that triggers ellipsis (8)', () => {
    expect(buildPages(1, 8)).toEqual([1, 2, 3, 4, 5, '...', 8]);
    expect(buildPages(4, 8)).toEqual([1, 2, 3, 4, 5, '...', 8]);
    expect(buildPages(5, 8)).toEqual([1, '...', 4, 5, 6, 7, 8]);
    expect(buildPages(8, 8)).toEqual([1, '...', 4, 5, 6, 7, 8]);
  });
});

describe('clampPage', () => {
  it('returns 1 when total is invalid', () => {
    expect(clampPage(5, 0)).toBe(1);
    expect(clampPage(5, -1)).toBe(1);
  });

  it('clamps value into [1, total]', () => {
    expect(clampPage(0, 5)).toBe(1);
    expect(clampPage(3, 5)).toBe(3);
    expect(clampPage(10, 5)).toBe(5);
  });
});
