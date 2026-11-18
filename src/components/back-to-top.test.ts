import { describe, expect, it } from 'vitest';
import { backToTopPosition, isBackToTopVisible } from './back-to-top';

describe('back to top', () => {
  it('shows at the upstream threshold', () => {
    expect(isBackToTopVisible(399)).toBe(false);
    expect(isBackToTopVisible(400)).toBe(true);
  });

  it('uses cubic easing and reaches the top after 450 ms', () => {
    expect(backToTopPosition(800, 0)).toBe(800);
    expect(backToTopPosition(800, 112.5)).toBe(750);
    expect(backToTopPosition(800, 225)).toBe(400);
    expect(backToTopPosition(800, 337.5)).toBe(50);
    expect(backToTopPosition(800, 450)).toBe(0);
    expect(backToTopPosition(800, 500)).toBe(0);
  });
});
