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
    expect(iconData('summary-actions').body).toContain('stroke-width="1.8"');
  });
});
