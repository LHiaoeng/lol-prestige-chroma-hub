import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('responsive layout contract', () => {
  it('keeps complete filters visible on desktop and collapsible on mobile', () => {
    const filters = source('src/components/Filters.astro');
    expect(filters).toContain('<details class="filter-disclosure" open>');
    expect(filters).toContain("matchMedia('(min-width: 768px)')");
    expect(filters).toContain("toggleAttribute('open', desktop.matches)");
    expect(filters).not.toContain('filter-shortcuts');
    for (const name of ['q', 'hero', 'version', 'category', 'isNew', 'sort']) {
      expect(filters).toContain(`name="${name}"`);
    }
    const css = source('src/styles/global.css');
    expect(css).toContain('.filter-disclosure:not([open])>.filters,.filters{display:grid}');
    expect(css).toMatch(/@media\(max-width:767px\)[\s\S]*?\.filter-disclosure:not\(\[open\]\)>\.filters\{display:none\}/);
  });

  it('keeps the complete detail list visible on desktop and collapsible on mobile', () => {
    const detail = source('src/pages/chromas/[slug].astro');
    expect(detail).toContain('class="detail-poster-copy"');
    expect(detail).toContain('<details class="detail-info-disclosure" open>');
    expect(detail).toContain("matchMedia('(min-width: 768px)')");
    expect(detail).toContain("toggleAttribute('open', desktop.matches)");
    expect(detail).toContain('class="sr-only detail-accessible-title"');
    expect(detail).toContain('.detail-info-disclosure:not([open])>.detail-info-body,.detail-info-body{display:block}');
    expect(detail).toMatch(/@media\(max-width:767px\)[\s\S]*?\.detail-info-disclosure:not\(\[open\]\)>\.detail-info-body\{display:none\}/);
    for (const label of ['Category', 'Category icon', 'Colors', 'Description', 'Base skin', 'Skinlines', 'Universes', 'Champions', 'Patch']) {
      expect(detail).toContain(label);
    }
  });

  it('uses the approved one, two, and three-column gallery progression', () => {
    const css = source('src/styles/global.css');
    expect(css).toContain('--touch-target:44px');
    expect(css).not.toContain('min-width:320px');
    expect(css).not.toContain('.filter-shortcuts');
    expect(css).toMatch(/\.chroma-grid\{[^}]*grid-template-columns:repeat\(3/);
    expect(css).toMatch(/@media\(max-width:1023px\)[\s\S]*?\.chroma-grid\{grid-template-columns:repeat\(2/);
    expect(css).toMatch(/@media\(max-width:767px\)[\s\S]*?\.chroma-grid\{grid-template-columns:1fr/);
  });

  it('keeps overlays and reading pages inside mobile dynamic viewports', () => {
    const viewer = source('src/components/ImageViewer.astro');
    const about = source('src/pages/about.astro');
    const actions = source('src/components/DetailActionMenu.astro');
    expect(viewer).toContain('100dvh');
    expect(viewer).toContain('safe-area-inset-top');
    expect(viewer).toContain('class="viewer-close-row"');
    expect(viewer).toContain('position:sticky');
    expect(about).toContain('var(--page-gutter)');
    expect(actions).toContain('calc(100vw - 28px)');
  });
});
