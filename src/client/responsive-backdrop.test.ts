import { describe, expect, it } from 'vitest';
import { calculateBackdropOffset } from './responsive-backdrop';

describe('responsive backdrop parallax', () => {
  const bounds = { left: 10, top: 20, width: 1000, height: 500 };

  it('keeps the image centered when the pointer is centered', () => {
    expect(calculateBackdropOffset(510, 270, bounds)).toEqual({ x: 0, y: 0 });
  });

  it('moves the image opposite to the pointer within the configured range', () => {
    expect(calculateBackdropOffset(10, 20, bounds)).toEqual({ x: 18, y: 12 });
    expect(calculateBackdropOffset(1010, 520, bounds)).toEqual({ x: -18, y: -12 });
  });
});
