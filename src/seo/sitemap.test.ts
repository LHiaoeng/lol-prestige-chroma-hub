import { describe, expect, it } from 'vitest';
import { catalog } from '../data/catalog';
import { renderSitemap } from './sitemap';
import type { PbeGraph } from '../domain/communitydragon-content';

describe('SEO sitemap', () => {
  it('renders crawlable editorial pages and excludes catalog detail pages', async () => {
    const championIndex = [...new Set(catalog.map((chroma) => chroma.heroId))].map((id) => ({ id, name: id === '103' ? 'Ahri' : `Champion ${id}`, slug: id === '103' ? 'ahri' : `champion-${id}` }));
    const xml = renderSitemap(championIndex);
    expect(xml).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    expect(xml).not.toContain('<loc>https://chromaart.lol/chromas/ahri-cat-eye-1/</loc>');
    expect(xml).not.toContain('<loc>https://chromaart.lol/zh-cn/chromas/ahri-cat-eye-1/</loc>');
    expect(xml).not.toContain('https://img.chromaart.lol/chromas/ahri/site3.jpg');
    expect(xml).toContain('<loc>https://chromaart.lol/about/</loc>');
    expect(xml).not.toContain('/editorial-policy/');
    expect(xml).toContain('<loc>https://chromaart.lol/privacy/</loc>');
    expect(xml).toContain('<loc>https://chromaart.lol/blog/</loc>');
    expect(xml).toContain('<loc>https://chromaart.lol/blog/what-are-chroma-skins/</loc>');
    expect(xml).toContain('<loc>https://chromaart.lol/zh-cn/blog/what-are-chroma-skins/</loc>');
    expect(xml).toContain('<lastmod>2026-07-20</lastmod>');
    expect(xml).toContain('<image:loc>https://chromaart.lol/img/blog/chroma-history-hero-en.png</image:loc>');
    expect(xml).toContain('<loc>https://chromaart.lol/blog/what-is-league-of-legends/</loc>');
    expect(xml).toContain('<loc>https://chromaart.lol/blog/champions-without-prestige-chroma/</loc>');
    expect(xml).not.toContain('<loc>https://chromaart.lol/chromas/1/</loc>');
    expect(xml).toContain('<loc>https://chromaart.lol/champions/ahri/</loc>');
    expect(xml).toContain('<loc>https://chromaart.lol/zh-cn/champions/ahri/</loc>');
    expect(xml).toContain('hreflang="zh-CN" href="https://chromaart.lol/zh-cn/champions/ahri/"');
    expect(xml).not.toContain('/champions/103/');
  });

  it('does not duplicate locations when the PBE graph supplies champion routes', () => {
    const graph = {
      champions: [{ id: 103, slug: 'ahri' }],
      skins: [],
      skinlines: [],
      universes: [],
    } as unknown as PbeGraph;
    const xml = renderSitemap([{ id: '103', name: 'Ahri', slug: 'ahri' }], graph);
    const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    expect(new Set(locations).size).toBe(locations.length);
  });
});
