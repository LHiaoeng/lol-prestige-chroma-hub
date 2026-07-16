import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('responsive layout contract', () => {
  it('provides semantic collapsible mobile navigation and filters', () => {
    expect(source('src/layouts/BaseLayout.astro')).toContain('class="mobile-nav"');
    expect(source('src/components/Filters.astro')).toContain('class="filter-disclosure"');
  });

  it('provides poster overlay and collapsible detail metadata', () => {
    const detail = source('src/pages/chromas/[slug].astro');
    expect(detail).toContain('class="detail-poster-copy"');
    expect(detail).toContain('class="detail-info-disclosure"');
  });

  it('uses the approved one, two, and three-column gallery progression', () => {
    const css = source('src/styles/global.css');
    expect(css).toContain('--touch-target:44px');
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
    expect(about).toContain('var(--page-gutter)');
    expect(actions).toContain('calc(100vw - 28px)');
  });
});
