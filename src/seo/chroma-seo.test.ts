import { describe, expect, it } from 'vitest';
import { catalog } from '../data/catalog';
import { chromaImageAlt, createChromaSeo } from './chroma-seo';
import * as siteSeo from './site';

const { HOME_SEO, SITE } = siteSeo;

describe('site SEO', () => {
  it('defines the agreed home intent', () => {
    expect(SITE).toMatchObject({
      name: 'LoL Chroma Art',
      origin: 'https://chromaart.lol',
      tagline: 'China-Exclusive Chroma Splash Art Archive',
    });
    expect(HOME_SEO.title).toBe('LoL China-Exclusive Chroma Splash Arts | LoL Chroma Art');
    expect(HOME_SEO.description).toContain('“China Exclusive” refers to the artwork');
    expect(HOME_SEO.description).toContain('not necessarily the chromas’ regional availability');
    expect(HOME_SEO.jsonLd).toEqual(expect.arrayContaining([
      expect.objectContaining({
        '@type': 'WebSite',
        name: 'LoL Chroma Art',
        alternateName: 'China-Exclusive Chroma Splash Art Archive',
      }),
      expect.objectContaining({ '@type': 'CollectionPage' }),
    ]));
  });

  it('defines China Exclusive as an artwork property, not a chroma availability claim', () => {
    expect(siteSeo).toHaveProperty('CHINA_EXCLUSIVE_DEFINITION', {
      en: '“China Exclusive” describes the standalone splash art shown on the Chinese League of Legends server—not necessarily the regional availability of the chroma itself.',
      zh: '“中国服专属”指独立炫彩原画在《英雄联盟》中国服务器中提供，并不表示该炫彩本身一定仅限中国服务器。',
    });
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
    expect(seo.description).toContain('standalone splash art shown in the Chinese version of League of Legends');
    expect(seo.description).toContain('chroma availability may differ by region');
    expect(seo.description).not.toContain('China-exclusive chroma');
    expect(seo.description).not.toBe(chroma.descriptionEn);
    expect(seo.imageAlt).toBe(`${chroma.nameEn} China-Exclusive Chroma Splash Art`);
  });

  it('derives Simplified Chinese metadata on the localized canonical route', () => {
    const chroma = catalog[0];
    const seo = createChromaSeo(chroma, 'zh-cn');
    expect(seo.canonical).toBe(`https://chromaart.lol/zh-cn/chromas/${chroma.slug}/`);
    expect(seo.title).toBe(`${chroma.nameZh} 中国服专属炫彩原画 | LoL Chroma Art`);
    expect(seo.description).toContain(chroma.nameZh);
    expect(seo.description).toContain(`版本 ${chroma.gameVer}`);
    expect(seo.imageAlt).toBe(`${chroma.nameZh} 中国服专属炫彩原画`);
    expect(seo.jsonLd[0]).toMatchObject({ inLanguage: 'zh-CN', url: seo.canonical });
  });

  it('keeps the growing catalog unique and concise', () => {
    const values = catalog.map((chroma) => createChromaSeo(chroma));
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
