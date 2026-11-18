import { describe, expect, it } from 'vitest';
import { catalog } from '../data/catalog';
import { chromaImageAlt, createChromaSeo } from './chroma-seo';
import { createHomeSeo } from './home-seo';
import * as siteSeo from './site';

const { SITE } = siteSeo;

describe('site SEO', () => {
  it('defines the agreed home intent', () => {
    expect(SITE).toMatchObject({
      name: 'LoL Chroma Art',
      origin: 'https://chromaart.lol',
      tagline: {
        en: 'League of Legends, Teamfight Tactics & Wild Rift Content Hub',
        'zh-cn': '英雄联盟、云顶之弈与英雄联盟手游内容聚合站',
      },
    });
    const home = createHomeSeo('en');
    expect(home.title).toBe('League of Legends, Teamfight Tactics & Wild Rift Content Hub | LoL Chroma Art');
    expect(home.description).toContain('China-server prestige chroma splash arts');
    expect(home.description).toContain('PBE additions, patches, and events');
    expect(home.jsonLd).toEqual(expect.arrayContaining([
      expect.objectContaining({
        '@type': 'WebSite',
        name: 'LoL Chroma Art',
      }),
      expect.objectContaining({ '@type': 'CollectionPage' }),
    ]));
    expect(home.jsonLd.find((item) => item['@type'] === 'WebSite')).not.toHaveProperty('alternateName');
  });

  it.each([
    ['en', 'en', 'https://chromaart.lol/'],
    ['zh-cn', 'zh-CN', 'https://chromaart.lol/zh-cn/'],
  ] as const)('keeps the %s home entities in the current locale', (locale, inLanguage, canonical) => {
    const home = createHomeSeo(locale);
    expect(home.canonical).toBe(canonical);
    const [website, collection] = home.jsonLd;
    expect(website).toMatchObject({ url: canonical, inLanguage });
    expect(collection).toMatchObject({ url: canonical, inLanguage, isPartOf: { '@id': website['@id'] } });
  });

  it('defines China Exclusive as an artwork property, not a chroma availability claim', () => {
    expect(siteSeo).toHaveProperty('CHINA_EXCLUSIVE_DEFINITION', {
      en: '“China Exclusive” describes the standalone Prestige Chroma splash art provided on the League of Legends China Server—not necessarily the regional availability of the chroma itself.',
      zh: '“中国服专属”指中国大陆服为臻彩单独提供的臻彩原画，并不表示对应炫彩一定仅限中国大陆服。',
    });
  });
});

describe('chroma SEO', () => {
  it('derives record-specific metadata', () => {
    const chroma = catalog[0];
    const seo = createChromaSeo(chroma);
    expect(seo.canonical).toBe(`https://chromaart.lol/chromas/${chroma.slug}/`);
    expect(seo.title).toBe(`League of Legends ${chroma.nameEn} Chroma Splash Art | LoL Chroma Art`);
    expect(seo.title).toContain(chroma.nameEn);
    expect(seo.title).toContain('LoL Chroma Art');
    expect(seo.description).toContain('League of Legends');
    expect(seo.description).toContain(`patch ${chroma.gameVer}`);
    expect(seo.description).toContain('standalone splash art shown in the Chinese version of League of Legends');
    expect(seo.description).toContain('chroma availability may differ by region');
    expect(seo.description).not.toContain('China-exclusive chroma');
    expect(seo.description).not.toBe(chroma.descriptionEn);
    expect(seo.imageAlt).toBe(`League of Legends ${chroma.nameEn} China-Server Chroma Splash Art`);
    expect(seo.jsonLd[1]).toMatchObject({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { position: 1, name: 'Home' },
        { position: 2, name: 'League of Legends', item: 'https://chromaart.lol/#home-tools-title' },
        { position: 3, name: 'Prestige chromas', item: 'https://chromaart.lol/#prestige-chroma-gallery' },
        { position: 4, name: chroma.nameEn, item: seo.canonical },
      ],
    });
  });

  it('derives Simplified Chinese metadata on the localized canonical route', () => {
    const chroma = catalog[0];
    const seo = createChromaSeo(chroma, 'zh-cn');
    expect(seo.canonical).toBe(`https://chromaart.lol/zh-cn/chromas/${chroma.slug}/`);
    expect(seo.title).toBe(`英雄联盟 ${chroma.nameZh} 臻彩原画 | LoL Chroma Art`);
    expect(seo.description).toContain(chroma.nameZh);
    expect(seo.description).toContain(`版本 ${chroma.gameVer}`);
    expect(seo.imageAlt).toBe(`英雄联盟 ${chroma.nameZh} 中国服臻彩原画`);
    expect(seo.jsonLd[0]).toMatchObject({ inLanguage: 'zh-CN', url: seo.canonical });
    expect(seo.jsonLd[1]).toMatchObject({
      itemListElement: [
        { position: 1, name: '首页' },
        { position: 2, name: '英雄联盟', item: 'https://chromaart.lol/zh-cn/#home-tools-title' },
        { position: 3, name: '臻彩原画', item: 'https://chromaart.lol/zh-cn/#prestige-chroma-gallery' },
        { position: 4, name: chroma.nameZh, item: seo.canonical },
      ],
    });
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
      .toBe('League of Legends Arcane Commander Caitlyn (Stellar) China-Server Chroma Splash Art');
  });
});
