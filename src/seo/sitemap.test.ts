import { describe, expect, it } from 'vitest';
import { renderSitemap } from './sitemap';

describe('SEO sitemap', () => {
  it('renders crawlable editorial pages and excludes catalog detail pages', () => {
    const xml = renderSitemap();
    expect(xml).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    expect(xml).not.toContain('<loc>https://chromaart.lol/chromas/ahri-cat-eye-1/</loc>');
    expect(xml).not.toContain('<loc>https://chromaart.lol/zh-cn/chromas/ahri-cat-eye-1/</loc>');
    expect(xml).not.toContain('https://img.chromaart.lol/chromas/ahri/site3.jpg');
    expect(xml).toContain('<loc>https://chromaart.lol/about/</loc>');
    expect(xml).toContain('<loc>https://chromaart.lol/privacy/</loc>');
    expect(xml).toContain('<loc>https://chromaart.lol/blog/</loc>');
    expect(xml).toContain('<loc>https://chromaart.lol/blog/what-are-chroma-skins/</loc>');
    expect(xml).toContain('<loc>https://chromaart.lol/zh-cn/blog/what-are-chroma-skins/</loc>');
    expect(xml).toContain('<lastmod>2026-07-20</lastmod>');
    expect(xml).toContain('<image:loc>https://chromaart.lol/img/blog/chroma-history-hero-en.png</image:loc>');
    expect(xml).toContain('<loc>https://chromaart.lol/blog/what-is-league-of-legends/</loc>');
    expect(xml).toContain('<loc>https://chromaart.lol/blog/champions-without-prestige-chroma/</loc>');
    expect(xml).not.toContain('<loc>https://chromaart.lol/chromas/1/</loc>');
  });
});
