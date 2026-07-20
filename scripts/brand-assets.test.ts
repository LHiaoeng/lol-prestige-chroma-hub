import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const publicDir = join(process.cwd(), 'public');

describe('public brand assets', () => {
  it('identifies the compact logo as LoL Chroma Art', () => {
    const logo = readFileSync(join(publicDir, 'logo.svg'), 'utf8');
    expect(logo).toContain('<title>LoL Chroma Art logo</title>');
  });

  it('uses the new brand in the fallback artwork', () => {
    const placeholder = readFileSync(join(publicDir, 'placeholder.svg'), 'utf8');
    expect(placeholder).toContain('LoL CHROMA</tspan><tspan fill="#f4f0e6"> ART</tspan>');
    expect(placeholder).toContain('data-brand-mark="logo" opacity=".2"');
    expect(placeholder).toContain('transform="translate(625 190) scale(25)"');
    expect(placeholder).toContain('x="800" y="635" opacity=".32"');
    expect(placeholder).not.toContain('>CHROMA ART<');
    expect(placeholder).not.toContain('M680 270h240l80 180-200 210-200-210z');
  });

  it('keeps the AdSense logo within upload constraints', () => {
    const image = readFileSync(join(publicDir, 'adsense-logo.png'));
    expect(image.subarray(1, 4).toString('ascii')).toBe('PNG');
    expect(image.readUInt32BE(16)).toBe(600);
    expect(image.readUInt32BE(20)).toBe(120);
    expect(image.byteLength).toBeLessThanOrEqual(150 * 1024);
  });
});
