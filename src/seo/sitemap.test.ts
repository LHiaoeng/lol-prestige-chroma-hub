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
    expect(xml).toContain('<loc>https://chromaart.lol/chromas/ahri-cat-eye-1/</loc>');
    expect(xml).toContain('<image:loc>https://img.chromaart.lol/chromas/ahri/site3.jpg</image:loc>');
    expect(xml).toContain('<image:title>Ahri Catseye &amp; Pearl China Exclusive Prestige Chroma splash art</image:title>');
    expect(xml).toContain('<loc>https://chromaart.lol/about/</loc>');
    expect(xml).toContain('<loc>https://chromaart.lol/privacy/</loc>');
    expect(xml).toContain('<loc>https://chromaart.lol/blog/</loc>');
    expect(xml).toContain('<loc>https://chromaart.lol/blog/what-is-league-of-legends/</loc>');
    expect(xml).not.toContain('<loc>https://chromaart.lol/chromas/1/</loc>');
  });
});
