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
    expect(css).toMatch(/@media\(max-width:767px\)[\s\S]*?\.filter-disclosure:not\(\[open]\)>\.filters\{display:none}/);
  });

  it('keeps the complete detail list visible on desktop and collapsible on mobile', () => {
    const detail = source('src/pages/chromas/[slug].astro');
    expect(detail).not.toContain('class="detail-poster-copy"');
    expect(detail).toContain('class="detail-preview-hint"');
    expect(detail).toContain('<details class="detail-info-disclosure" open>');
    expect(detail).toContain("matchMedia('(min-width: 768px)')");
    expect(detail).toContain("toggleAttribute('open', desktop.matches)");
    expect(detail).toContain('class="sr-only detail-accessible-title"');
    expect(detail).toContain('.detail-info-disclosure:not([open])>.detail-info-body,.detail-info-body{display:block}');
    expect(detail).toMatch(/@media\(max-width:767px\)[\s\S]*?\.detail-info-disclosure:not\(\[open]\)>\.detail-info-body\{display:none}/);
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
    expect(viewer).toContain('width:100vw;max-width:none;height:100dvh;max-height:none;margin:0;padding:0');
    expect(viewer).toContain('width:auto;height:auto;max-width:100vw;max-height:100dvh;margin:auto');
    expect(viewer).not.toContain('aspect-ratio:16/9');
    expect(viewer).toContain('safe-area-inset-top');
    expect(viewer).toContain('class="viewer-controls"');
    expect(viewer).toContain('position:fixed');
    expect(about).toContain('var(--page-gutter)');
    expect(actions).toContain('calc(100vw - 28px)');
  });

  it('centers the header language toggle label in both axes', () => {
    const layout = source('src/layouts/BaseLayout.astro');
    expect(layout).toContain('.language-toggle { display: inline-flex; align-items: center; justify-content: center;');
  });

  it('uses medium detail background artwork while keeping the content and preview large', () => {
    const detail = source('src/pages/chromas/[slug].astro');
    const viewer = source('src/components/ImageViewer.astro');
    expect(detail).toContain('const mobileImage = imageUrl(chroma.images.medium)');
    expect(detail).toContain('<source media="(max-width: 767px)" srcset={mobileImage}');
    expect(detail).toContain("data-fallback={sourceImageUrl('medium', chroma.instanceId)}");
    const viewerUsage = detail.match(/<ImageViewer[\s\S]*?\/>/)?.[0];
    expect(viewerUsage).toBeDefined();
    expect(viewerUsage).not.toContain('mobileSrc=');
    expect(viewerUsage).not.toContain('mobileFallback=');
    expect(viewer).toContain('<img class="viewer-full" src={src}');
    expect(detail).toContain('.detail-image :global(.viewer-image){height:auto;object-fit:contain}');
  });

  it('orders uncropped mobile detail content over a first-screen background', () => {
    const detail = source('src/pages/chromas/[slug].astro');
    const css = source('src/styles/global.css');
    const hintIndex = detail.indexOf('class="detail-preview-hint"');
    const titleIndex = detail.indexOf('class="detail-title-row"');
    const detailsIndex = detail.indexOf('<details class="detail-info-disclosure"');
    expect(css).toContain('.detail-image{width:100%;height:auto;aspect-ratio:auto;');
    expect(detail).toContain("{isZh ? '点击图片预览' : 'Click the image to preview'}");
    expect(hintIndex).toBeGreaterThan(-1);
    expect(hintIndex).toBeLessThan(titleIndex);
    expect(titleIndex).toBeLessThan(detailsIndex);
    expect(detail).toContain('height:calc(100svh - var(--site-header-height))');
    expect(detail).not.toContain('.detail-background{height:540px}');
  });

  it('uses medium home hero artwork on mobile while keeping the large desktop image', () => {
    const home = source('src/pages/index.astro');
    const backdrop = source('src/components/ResponsiveHeroBackdrop.astro');
    expect(home).toContain('largeSrc={imageUrl(featuredChroma.images.large)}');
    expect(home).toContain('mediumSrc={imageUrl(featuredChroma.images.medium)}');
    expect(home).toContain("mediumFallback={sourceImageUrl('medium', featuredChroma.instanceId)}");
    expect(backdrop).toContain('<source media="(max-width: 767px)" srcset={mediumSrc}');
    expect(backdrop).toMatch(/<img\s+data-backdrop-image\s+src=\{largeSrc\}/);
  });
});
