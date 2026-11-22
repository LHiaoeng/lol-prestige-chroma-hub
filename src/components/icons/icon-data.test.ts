import { readFileSync } from 'node:fs';
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
    expect(iconData('theme-switch').body).toContain('M7.02 3.635');
    expect(iconData('MoonOutlined').custom).toBe(false);
    expect(iconData('SunOutlined').custom).toBe(false);
    expect(iconData('SyncOutlined').custom).toBe(false);
  });

  it('renders both Riot skinline masks in the shared theme color', () => {
    const icon = iconData('skinlines');
    expect(icon.viewBox).toBe('-3 -3 30 30');
    expect(icon.body).toContain('fill="currentColor" stroke="none"');
    expect(icon.body).not.toContain('transform=');
    expect(icon.body).toContain('d="M7.8 3.6');
    expect(icon.body.match(/<path /g)).toHaveLength(2);
  });

  it('renders all three Riot masks for universes', () => {
    const icon = iconData('universes');
    expect(icon.viewBox).toBe('4.60 -3.40 30.80 30.80');
    expect(icon.body).toContain('fill="currentColor"');
    expect(icon.body).not.toContain('transform=');
    expect(icon.body.match(/<path /g)).toHaveLength(3);
  });

  it('uses the corresponding logo layer for champions and skins', () => {
    const logo = readFileSync(new URL('../../../public/logo.svg', import.meta.url), 'utf8');
    const layers = [...logo.matchAll(/<path [^>]*\sd="([^"]+)"/g)];
    expect(layers).toHaveLength(2);
    for (const [index, name] of (['champions', 'skins'] as const).entries()) {
      const icon = iconData(name);
      expect(icon.viewBox).toBe('0 0 24 24');
      expect(icon.body).toContain(`d="${layers[index]![1]}"`);
      expect(icon.body.match(/<path /g)).toHaveLength(1);
      expect(icon.body).toContain('fill="currentColor"');
    }
  });

  it('renders both header game marks on the shared monochrome SVG canvas', () => {
    for (const name of ['league-of-legends', 'teamfight-tactics'] as const) {
      const icon = iconData(name);
      expect(icon.viewBox).toBe('0 0 24 24');
      expect(icon.body).toContain('fill="currentColor"');
    }
  });
});
