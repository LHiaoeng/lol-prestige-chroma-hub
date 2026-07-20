import { describe, expect, it } from 'vitest';
import { backToTopBehavior, isBackToTopVisible } from './back-to-top';

describe('back to top', () => {
  it('shows only after the configured scroll threshold', () => {
    expect(isBackToTopVisible(480)).toBe(false);
    expect(isBackToTopVisible(481)).toBe(true);
  });

  it('respects reduced motion when selecting scroll behavior', () => {
    expect(backToTopBehavior(false)).toBe('smooth');
    expect(backToTopBehavior(true)).toBe('auto');
  });
});
