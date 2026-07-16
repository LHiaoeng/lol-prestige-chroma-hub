import { describe, expect, it } from 'vitest';
import { catalog } from '../data/catalog';
import { chromaImageAlt, createChromaSeo } from './chroma-seo';
import { HOME_SEO, SITE } from './site';

describe('site SEO', () => {
  it('defines the agreed home intent', () => {
    expect(SITE).toMatchObject({ name: 'CHROMA ART', origin: 'https://chromaart.lol' });
    expect(HOME_SEO.title).toBe('LoL China Exclusive Prestige Chroma Splash Arts | CHROMA ART');
    expect(HOME_SEO.description).toContain('League of Legends');
    expect(HOME_SEO.description).toContain('China Exclusive Prestige Chromas');
    expect(HOME_SEO.jsonLd).toEqual(expect.arrayContaining([
      expect.objectContaining({ '@type': 'WebSite', name: 'CHROMA ART' }),
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
    expect(seo.title).toContain('China Exclusive Prestige Chroma');
    expect(seo.title).toContain('CHROMA ART');
    expect(seo.description).toContain('League of Legends');
    expect(seo.description).toContain(`patch ${chroma.gameVer}`);
    expect(seo.description).not.toBe(chroma.descriptionEn);
    expect(seo.imageAlt).toBe(`${chroma.nameEn} China Exclusive Prestige Chroma splash art`);
  });

  it('keeps the growing catalog unique and concise', () => {
    const values = catalog.map(createChromaSeo);
    expect(new Set(values.map(({ canonical }) => canonical)).size).toBe(catalog.length);
    expect(new Set(values.map(({ title }) => title)).size).toBe(catalog.length);
    expect(values.every(({ title }) => title.length <= 110)).toBe(true);
    expect(values.every(({ description }) => description.length <= 180)).toBe(true);
    expect(values.every(({ description }) => description.includes('China Exclusive Prestige Chroma'))).toBe(true);
  });

  it('formats reusable image text', () => {
    expect(chromaImageAlt('Arcane Commander Caitlyn (Stellar)'))
      .toBe('Arcane Commander Caitlyn (Stellar) China Exclusive Prestige Chroma splash art');
  });
});
