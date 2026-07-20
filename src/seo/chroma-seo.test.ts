import { describe, expect, it } from 'vitest';
import { catalog } from '../data/catalog';
import { chromaImageAlt, createChromaSeo } from './chroma-seo';
import { HOME_SEO, SITE } from './site';

describe('site SEO', () => {
  it('defines the agreed home intent', () => {
    expect(SITE).toMatchObject({
      name: 'LoL Chroma Art',
      origin: 'https://chromaart.lol',
      tagline: 'China-Exclusive Chroma Splash Art Archive',
    });
    expect(HOME_SEO.title).toBe('LoL China-Exclusive Chroma Splash Arts | LoL Chroma Art');
    expect(HOME_SEO.description).toBe('Explore an independent archive of unique splash arts created for selected chromas in the Chinese version of League of Legends, operated by Tencent.');
    expect(HOME_SEO.jsonLd).toEqual(expect.arrayContaining([
      expect.objectContaining({
        '@type': 'WebSite',
        name: 'LoL Chroma Art',
        alternateName: 'China-Exclusive Chroma Splash Art Archive',
      }),
      expect.objectContaining({ '@type': 'CollectionPage' }),
    ]));
  });
});

describe('chroma SEO', () => {
  it('derives record-specific metadata', () => {
    const chroma = catalog[0];
    const seo = createChromaSeo(chroma);
    expect(seo.canonical).toBe(`https://chromaart.lol/chromas/${chroma.slug}/`);
    expect(seo.title).toContain(chroma.nameEn);
    expect(seo.title).toContain('China-Exclusive Chroma Splash Art');
    expect(seo.title).toContain('LoL Chroma Art');
    expect(seo.description).toContain('League of Legends');
    expect(seo.description).toContain(`patch ${chroma.gameVer}`);
    expect(seo.description).not.toBe(chroma.descriptionEn);
    expect(seo.imageAlt).toBe(`${chroma.nameEn} China-Exclusive Chroma Splash Art`);
  });

  it('keeps the growing catalog unique and concise', () => {
    const values = catalog.map(createChromaSeo);
    expect(new Set(values.map(({ canonical }) => canonical)).size).toBe(catalog.length);
    expect(new Set(values.map(({ title }) => title)).size).toBe(catalog.length);
    expect(values.every(({ title }) => title.length <= 110)).toBe(true);
    expect(values.every(({ description }) => description.length <= 180)).toBe(true);
    expect(values.every(({ description }) => description.includes('the Chinese version of League of Legends'))).toBe(true);
  });

  it('formats reusable image text', () => {
    expect(chromaImageAlt('Arcane Commander Caitlyn (Stellar)'))
      .toBe('Arcane Commander Caitlyn (Stellar) China-Exclusive Chroma Splash Art');
  });
});
