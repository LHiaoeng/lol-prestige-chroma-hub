import { describe, expect, it } from 'vitest';
import { iconData } from './icon-data';

describe('iconData', () => {
  it('renders an upstream SVG definition', () => {
    const icon = iconData('CheckCircleFilled');
    expect(icon).toMatchObject({ viewBox: '64 64 896 896', custom: false });
    expect(icon.body).toContain('<path');
    expect(icon.body).toContain('d="');
  });

  it('keeps domain and project-only glyphs in the shared registry', () => {
    expect(iconData('skins')).toMatchObject({ viewBox: '0 0 24 24', custom: true });
    expect(iconData('tft-companions').body).toContain('fill-rule="evenodd"');
    expect(iconData('tft-arenas').body).toContain('scale(.85714)');
    expect(iconData('summary-actions').body).toContain('stroke-width="1.8"');
  });

  it('renders both header game marks on the shared monochrome SVG canvas', () => {
    for (const name of ['league-of-legends', 'teamfight-tactics'] as const) {
      const icon = iconData(name);
      expect(icon.viewBox).toBe('0 0 24 24');
      expect(icon.body).toContain('fill="currentColor"');
    }
  });
});
