import { describe, expect, it } from 'vitest';
import type { ChampionDetail } from '../domain/champion-detail';
import { createChampionSeo } from './champion-seo';

const champion: ChampionDetail = {
  id: '103',
  slug: 'ahri',
  en: { name: 'Ahri', title: 'the Nine-Tailed Fox', shortBio: 'English biography' },
  zh: { name: '阿狸', title: '九尾妖狐', shortBio: '中文背景故事' },
  portraitUrl: 'https://raw.communitydragon.org/latest/portrait.png',
  splashUrl: 'https://raw.communitydragon.org/latest/splash.png',
  skins: [],
};

describe('champion SEO', () => {
  it('creates the English canonical and structured data', () => {
    const seo = createChampionSeo(champion);
    expect(seo.canonical).toBe('https://chromaart.lol/champions/ahri/');
    expect(seo.title).toContain('Ahri');
    expect(seo.jsonLd[0]).toMatchObject({ '@type': 'WebPage', inLanguage: 'en', url: seo.canonical });
  });

  it('creates the Simplified Chinese canonical and copy', () => {
    const seo = createChampionSeo(champion, 'zh-cn');
    expect(seo.canonical).toBe('https://chromaart.lol/zh-cn/champions/ahri/');
    expect(seo.title).toMatch(/^阿狸 — 九尾妖狐/);
    expect(seo.description).toContain('英雄资料');
    expect(seo.jsonLd[0]).toMatchObject({ inLanguage: 'zh-CN' });
  });
});
