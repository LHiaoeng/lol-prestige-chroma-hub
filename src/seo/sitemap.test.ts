import { describe, expect, it } from 'vitest';
import { catalog } from '../data/catalog';
import { renderSitemap } from './sitemap';

describe('SEO sitemap', () => {
  it('renders escaped canonical page and image entries', () => {
    const chroma = {
      ...catalog[0],
      slug: 'ahri-cat-eye-1',
      nameEn: 'Ahri Catseye & Pearl',
      images: { ...catalog[0].images, large: 'assets/chromas/ahri/site3.jpg' },
    };
    const xml = renderSitemap([chroma]);
    expect(xml).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    expect(xml).toContain('<loc>https://chromaart.lol/chromas/ahri-cat-eye-1/</loc>');
    expect(xml).toContain('<loc>https://chromaart.lol/zh-cn/chromas/ahri-cat-eye-1/</loc>');
    expect(xml).toContain('<xhtml:link rel="alternate" hreflang="en" href="https://chromaart.lol/chromas/ahri-cat-eye-1/"/>');
    expect(xml).toContain('<xhtml:link rel="alternate" hreflang="zh-CN" href="https://chromaart.lol/zh-cn/chromas/ahri-cat-eye-1/"/>');
    expect(xml).toContain('<xhtml:link rel="alternate" hreflang="x-default" href="https://chromaart.lol/chromas/ahri-cat-eye-1/"/>');
    expect(xml).toContain('<image:loc>https://img.chromaart.lol/chromas/ahri/site3.jpg</image:loc>');
    expect(xml).toContain('<image:title>Ahri Catseye &amp; Pearl China-Exclusive Chroma Splash Art</image:title>');
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
