import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('blog feature contract', () => {
  it('links every verified official prestige chroma source in both languages', () => {
    const page = source('src/pages/blog/what-are-prestige-chromas.astro');
    const officialUrls = [
      'https://lol.qq.com/act/a202607034771tendraws31/index.html',
      'https://lol.qq.com/act/a202606264151prizewheel/index.html',
      'https://lol.qq.com/act/a202606117610prizewheel/index.html',
      'https://www.bilibili.com/video/BV1EQF3z7ETt',
      'https://www.bilibili.com/video/BV1w5E96ME4h',
      'https://lol.qq.com/act/a2023lpl10celebration2s/index.html?pos=2',
      'https://lol.qq.com/news/space-detail.shtml?docid=2507283551738806898',
    ];
    for (const url of officialUrls) expect(page.split(url)).toHaveLength(3);
    expect(page.match(/class="official-source-link"/g)).toHaveLength(14);
    expect(page.match(/target="_blank" rel="noreferrer"/g)).toHaveLength(14);
    for (const label of [
      'Official acquisition sources',
      'Official cultural sources',
      'Brilliant Prestige Summoning — July 2026',
      'Lucky Gate — June 26, 2026',
      'Lucky Gate — June 11, 2026',
      '“Rushi Ge” — Bamboo and Plum Prestige Chroma theme song',
      'Dunhuang Prestige Chroma showcase',
      'LPL 10th Anniversary commemorative Prestige Chromas',
      'Panda Lux Prestige Chroma charity project',
      '官方获取来源',
      '官方文化来源',
      '璀璨臻彩召唤 — 2026 年 7 月',
      '幸运之门 — 2026 年 6 月 26 日',
      '幸运之门 — 2026 年 6 月 11 日',
      '《如是歌》— 竹映梅香臻彩系列主题曲',
      '敦煌臻彩展示片',
      'LPL 十周年纪念臻彩',
      '熊猫拉克丝臻彩公益项目',
    ]) expect(page).toContain(label);
  });

  it('defines China Exclusive as an artwork property in the prestige chroma FAQ', () => {
    const page = source('src/pages/blog/what-are-prestige-chromas.astro');
    expect(page).toContain("import { CHINA_EXCLUSIVE_DEFINITION, SITE } from '../../seo/site'");
    expect(page).toContain('CHINA_EXCLUSIVE_DEFINITION.en');
    expect(page).toContain('CHINA_EXCLUSIVE_DEFINITION.zh');
    expect(page).toContain('The chroma itself may also be available in other regions');
    expect(page).toContain('炫彩本身也可能在其他地区提供');
    expect(page).not.toContain('Some prestige chromas are released for all regions, while others may be limited to the Chinese server');
  });

  it('renders shared non-circular previous and next navigation on every article', () => {
    const component = source('src/components/BlogAdjacentNavigation.astro');
    expect(component).toContain('adjacentBlogArticles(currentSlug)');
    expect(component).toContain('Previous article');
    expect(component).toContain('Next article');
    expect(component).toContain('上一篇');
    expect(component).toContain('下一篇');
    expect(component).toContain('href={articleHref(older, locale)}');
    expect(component).toContain('href={articleHref(newer, locale)}');
    expect(component).toContain('aria-label=');
    expect(component).toContain('width:min(var(--content-width),calc(100% - (var(--page-gutter) * 2)))');
    expect(component).toContain('grid-template-columns:repeat(2,minmax(0,1fr))');
    expect(component).toContain('@media (max-width:767px)');
    for (const pagePath of [
      'src/pages/blog/patch-26-15-prestige-chromas.astro',
      'src/pages/blog/kaisa-prestige-chroma.astro',
      'src/pages/blog/champions-without-prestige-chroma.astro',
      'src/pages/blog/what-are-prestige-chromas.astro',
      'src/pages/blog/what-are-chroma-skins.astro',
      'src/pages/blog/what-is-league-of-legends.astro',
      'src/pages/blog/top-2-prestige-chroma-champions.astro',
    ]) {
      const page = source(pagePath);
      expect(page.match(/<BlogAdjacentNavigation currentSlug=\{article\.slug\} \{locale\} \/>/g)).toHaveLength(1);
    }
  });

  it('links the blog from the header and footer on every page', () => {
    const layout = source('src/layouts/BaseLayout.astro');
    expect(layout.match(/localizedPath\(locale, '\/blog\/'\)/g)).toHaveLength(2);
    expect(layout).toContain('class="header-blog-link"');
    expect(layout).toContain("isZh ? '博客' : 'Blog'");
    expect(layout).toContain('min-height: var(--touch-target)');
    expect(layout).toContain("ogType?: 'website' | 'article'");
    expect(layout).toContain('const socialImage = new URL(image, SITE.origin).toString()');
    expect(layout).toContain('property="article:published_time"');
    expect(layout).toContain('property="article:modified_time"');
  });

  it('renders a locale-aware responsive featured blog list', () => {
    const page = source('src/pages/blog/index.astro');
    expect(page).toContain("'@type': 'CollectionPage'");
    expect(page).toContain("const isZh = locale === 'zh-cn'");
    expect(page).toContain('<article class="featured-post">');
    expect(page).toContain('blogArticles.map((entry, index)');
    expect(page).toContain('href={articleHref(entry, locale)}');
    expect(page).toContain("formatBlogDate(entry.publishedAt, isZh ? 'zh' : 'en')");
    expect(page).toContain('data-placeholder="/placeholder.svg"');
    expect(page).toContain('@media (max-width: 1023px)');
    expect(page).toContain('@media (max-width: 767px)');
    expect(page).toContain('grid-template-columns:minmax(0,1fr) minmax(320px,1fr)');
    expect(page).toContain('min-height:360px');
    expect(page).toContain('-webkit-line-clamp:3');
    expect(page).toContain('.featured-post-link { grid-template-columns:1fr; height:auto; min-height:0; }');
  });

  it('renders the localized chroma history article from portable local media', () => {
    const page = source('src/pages/blog/what-are-chroma-skins.astro');
    expect(page).toContain("'@type': 'BlogPosting'");
    expect(page).toContain("'@type': 'BreadcrumbList'");
    expect(page).toContain("inLanguage: isZh ? 'zh-CN' : 'en'");
    expect(page).toContain('ogType="article"');
    expect(page.match(/<article class="blog-article"/g)).toHaveLength(2);
    expect(page).toContain('<h1>{article.titleEn}</h1>');
    expect(page).toContain('<h1>{article.titleZh}</h1>');
    expect(page).toContain('推出背景');
    expect(page).toContain('皮肤展示');
    expect(page).toContain('购买方式');
    expect(page).toContain('配色方案');
    expect(page).toContain('限时促销');
    expect(page).not.toContain('<h2>基本信息</h2>');
    expect(page).toContain('${mediaRoot}individual-purchase-en.png');
    expect(page).toContain('${mediaRoot}blue-essence-en.png');
    expect(page.match(/<details>/g)).toHaveLength(16);
    expect(page).toContain('.article-header,.blog-article>section,.blog-article>figure,.comparison,.showcase');
    expect(page).toContain("const mediaRoot = '/img/blog/chroma-history-'");
    expect(page).toContain('loading="lazy"');
    expect(page).not.toContain('Baidu Baike');
    expect(page).not.toContain('百度百科');
    expect(page).toContain('炫彩皮肤于 6.17 版本上线');
    expect(page).toContain("formatBlogDate(article.publishedAt, 'en')");
    expect(page).toContain("formatBlogDate(article.publishedAt, 'zh')");
    expect(page).toContain('width:min(var(--content-width),calc(100% - (var(--page-gutter) * 2)))');
  });

  it('uses the rank-one chroma artwork as a responsive full-page atmosphere layer', () => {
    const page = source('src/pages/blog/index.astro');
    const backdrop = source('src/components/ResponsiveHeroBackdrop.astro');
    expect(page).toContain("const backgroundChroma = catalog.find((item) => item.rank === 1)");
    expect(page).toContain('<section class="blog-hero" data-backdrop-scope>');
    expect(page).toContain('<div class="blog-backdrop">');
    expect(page).toContain('largeSrc={imageUrl(backgroundChroma.images.large)}');
    expect(page).toContain('mediumSrc={imageUrl(backgroundChroma.images.medium)}');
    expect(page).toContain('height:calc(100svh - var(--site-header-height))');
    expect(page.match(/<section class="blog-hero"[\s\S]*?<section class="blog-index">/)?.[0]).toBeDefined();
    expect(backdrop).toContain('<source media="(max-width: 767px)" srcset={mediumSrc}');
    expect(backdrop).toMatch(/<img\s+data-backdrop-image\s+src=\{largeSrc\}/);
  });

  it('renders a complete localized illustrated article', () => {
    const page = source('src/pages/blog/what-is-league-of-legends.astro');
    expect(page).toContain("'@type': 'BlogPosting'");
    expect(page).toContain("'@type': 'BreadcrumbList'");
    expect(page).toContain("inLanguage: isZh ? 'zh-CN' : 'en'");
    expect(page).toContain('ogType="article"');
    expect(page.match(/<article class="blog-article"/g)).toHaveLength(2);
    expect(page.match(/<figure>/g)?.length).toBeGreaterThanOrEqual(3);
    expect(page).toContain('data-alt-en=');
    expect(page).toContain('data-alt-zh=');
    expect(page).toContain('loading="lazy"');
    expect(page).toContain('data-placeholder="/placeholder.svg"');
    expect(page).toContain("formatBlogDate(article.publishedAt, 'en')");
    expect(page).toContain("formatBlogDate(article.publishedAt, 'zh')");
    expect(page).toContain('width:min(var(--content-width),calc(100% - (var(--page-gutter) * 2)))');
    expect(page).not.toContain('width:min(760px');
    expect(page).not.toContain('max-width:720px');
    for (const heading of [
      'A team strategy game',
      'Summoner\u2019s Rift and the Nexus',
      'Five players, five positions',
      'How a match gains momentum',
      'A game that keeps evolving',
      '团队策略游戏',
      '召唤师峡谷与水晶枢纽',
      '五名玩家，五个位置',
      '一场对局如何积累优势',
      '持续进化的游戏',
    ]) expect(page).toContain(heading);
  });

  it('renders a complete localized prestige chroma article', () => {
    const page = source('src/pages/blog/what-are-prestige-chromas.astro');
    expect(page).toContain("'@type': 'BlogPosting'");
    expect(page).toContain("'@type': 'BreadcrumbList'");
    expect(page).toContain("inLanguage: isZh ? 'zh-CN' : 'en'");
    expect(page).toContain('ogType="article"');
    expect(page.match(/<article class="blog-article"/g)).toHaveLength(2);
    expect(page).toContain('<h1>{article.titleEn}</h1>');
    expect(page).toContain('<h1>{article.titleZh}</h1>');
    expect(page).toContain('data-alt-en=');
    expect(page).toContain('data-alt-zh=');
    expect(page).toContain('data-placeholder="/placeholder.svg"');
    expect(page).toContain("formatBlogDate(article.publishedAt, 'en')");
    expect(page).toContain("formatBlogDate(article.publishedAt, 'zh')");
    expect(page).toContain('width:min(var(--content-width),calc(100% - (var(--page-gutter) * 2)))');
    for (const heading of [
      'What are prestige chromas?',
      'The chroma art showcase',
      'What sets them apart',
      'The collection system',
      'How to obtain prestige chromas',
      'Design philosophy',
      'Cultural content and collaborations',
      '什么是臻彩？',
      '臻彩原画展示',
      '与普通炫彩的区别',
      '臻彩藏馆系统',
      '获取方式',
      '设计理念',
      '文化内容与合作',
    ]) expect(page).toContain(heading);
    for (const fact of [
      'January 13, 2023',
      '2023 年 1 月 13 日',
      'Splendid Treasure Summoning',
      '华彩秘宝·召唤',
      'theme music',
      '主题音乐',
      'charitable',
      '公益',
      'LPL tenth anniversary',
      'LPL 十周年',
    ]) expect(page).toContain(fact);
    expect(page).not.toMatch(/\[[0-9]+(?:-[0-9]+)?\]/);
    expect(page).toContain("e26f28ec-534a-442a-b4be-3406116f93da");
    expect(page).toContain("9c393600-64bc-402b-8b02-f57f3211d9c3");
    expect(page).toContain('天龙之子 伊泽瑞尔 飞天 — 东方配色、纹样与装饰细节');
    expect(page).toContain('无畏竞巅峰 薇恩 — LPL 十周年纪念臻彩');
    expect(page).toContain('href={localizedPath(locale, `/chromas/${chroma.slug}/`)}');
    expect(page).toContain('href={localizedPath(locale, `/chromas/${designChroma.slug}/`)}');
    expect(page).toContain('href={localizedPath(locale, `/chromas/${cultureChroma.slug}/`)}');
    expect(page).toContain('class="chroma-art-link"');
    expect(page.match(/<details>/g)).toHaveLength(12);
  });

  it('renders a complete localized Kai\'Sa prestige chroma spotlight', () => {
    const page = source('src/pages/blog/kaisa-prestige-chroma.astro');
    expect(page).toContain("'@type': 'BlogPosting'");
    expect(page).toContain("'@type': 'BreadcrumbList'");
    expect(page).toContain("inLanguage: isZh ? 'zh-CN' : 'en'");
    expect(page).toContain('ogType="article"');
    expect(page.match(/<article class="blog-article"/g)).toHaveLength(2);
    expect(page).toContain('<h1>{article.titleEn}</h1>');
    expect(page).toContain('<h1>{article.titleZh}</h1>');
    expect(page).toContain('data-alt-en=');
    expect(page).toContain('data-alt-zh=');
    expect(page).toContain('data-placeholder="/placeholder.svg"');
    expect(page).toContain("formatBlogDate(article.publishedAt, 'en')");
    expect(page).toContain("formatBlogDate(article.publishedAt, 'zh')");
    expect(page).toContain('width:min(var(--content-width),calc(100% - (var(--page-gutter) * 2)))');
    expect(page).toContain("const kaisaHeroId = '145'");
    expect(page).toContain('kaisaChromas');
    expect(page).toContain('kaisaSkinGroups');
    expect(page).toContain('chroma-grid');
    expect(page).toContain('imageUrl(chroma.images.medium)');
    expect(page).toContain('sourceImageUrl');
    for (const heading of [
      'Champion profile: Kai\'Sa',
      'Kai\'Sa\'s prestige chroma collection',
      'What are prestige chromas?',
      'How to obtain Kai\'Sa\'s prestige chromas',
      '英雄简介：卡莎',
      '卡莎的臻彩收藏',
      '什么是臻彩？',
      '如何获取卡莎的臻彩',
    ]) expect(page).toContain(heading);
    expect(page.match(/<details>/g)).toHaveLength(10);
    expect(page).toContain('<style is:global>');
    expect(page.match(/class="article-hero"/g)).toHaveLength(2);
    expect(page).toContain('.article-hero img{display:block;width:100%;height:auto');
    expect(page).toContain('grid-template-columns:repeat(6,minmax(0,1fr))');
    expect(page).toContain('left:50%;bottom:7px;transform:translateX(-50%)');
    expect(page).toContain('display:inline-flex;line-height:0');
    expect(page).toContain('justify-content:center;text-align:center');
    expect(page).toContain('.chroma-card-img-wrap{position:relative;width:100%;overflow:hidden;background:');
    expect(page).toContain('.chroma-card-img-wrap img{display:block;width:100%;height:auto}');
    expect(page).toContain("href={localizedPath(locale, '/blog/what-are-prestige-chromas/')}");
    expect(page).not.toContain('most played and most banned');
    expect(page).not.toContain('出场率和禁率最高');
    expect(page).not.toContain('may rotate into the Mythic Shop');
    expect(page).not.toContain('会不定期进入神话商店');
    expect(page).not.toContain("Heavenscale Kai\\'a");
  });

  it('renders a complete localized top-2 prestige chroma champions article', () => {
    const page = source('src/pages/blog/top-2-prestige-chroma-champions.astro');
    expect(page).toContain("'@type': 'BlogPosting'");
    expect(page).toContain("'@type': 'BreadcrumbList'");
    expect(page).toContain('ogType="article"');
    expect(page.match(/<article class="blog-article"/g)).toHaveLength(2);
    expect(page).toContain('<h1>Patch 26.15: {article.titleEn}</h1>');
    expect(page).toContain('<h1>26.15 版本：{article.titleZh}</h1>');
    expect(page).toContain('data-alt-en=');
    expect(page).toContain('data-alt-zh=');
    expect(page).toContain('data-placeholder="/placeholder.svg"');
    expect(page).toContain("formatBlogDate(article.publishedAt, 'en')");
    expect(page).toContain("formatBlogDate(article.publishedAt, 'zh')");
    expect(page).toContain('chroma-grid');
    expect(page).toContain("href={localizedPath(locale, '/blog/what-are-prestige-chromas/')}");
    expect(page).toContain("href={localizedPath(locale, '/blog/champion-most-prestige-chromas/')}");
    expect(page).toContain("href={localizedPath(locale, '/blog/what-are-chroma-skins/')}");
    expect(page).toContain('<style is:global>');
    expect(page.match(/class="article-hero"/g)).toHaveLength(2);
    expect(page.match(/<details>/g)).toHaveLength(6);
    expect(page).not.toContain('？---');
  });

  it('derives and refreshes every champion coverage fact', () => {
    const page = source('src/pages/blog/champions-without-prestige-chroma.astro');
    const client = source('src/client/champion-coverage-refresh.ts');
    expect(page).toContain('fetchChampionCoverage(fetch, coveredHeroIds, patchVersion)');
    expect(page).toContain('championCoverageCopy(snapshot)');
    expect(page).toContain('id="champion-coverage-config"');
    expect(page).toContain('initializeChampionCoverageRefresh(document)');
    expect(page.match(/data-coverage-list="(?:en|zh)"/g)).toHaveLength(2);
    expect(page).not.toContain('data-coverage-status');
    expect(page).not.toContain('已从 CommunityDragon 刷新实时数据。');
    expect(page).not.toContain('下面就是目前<strong>还没有</strong>臻彩原画的英雄。');
    expect(page).not.toContain("Below is every champion that <strong>doesn't have</strong> a prestige chroma splash art yet.");
    expect(page.match(/data-coverage-refresh/g)).toHaveLength(2);
    expect(client).toContain("querySelectorAll<HTMLButtonElement>('[data-coverage-refresh]')");
    expect(page.indexOf('<h2>By the numbers</h2>')).toBeLessThan(page.indexOf('<h2>Complete list</h2>'));
    expect(page.indexOf('<h2>数据一览</h2>')).toBeLessThan(page.indexOf('<h2>完整名单</h2>'));
    for (const key of [
      'deckEn', 'deckZh', 'captionEn', 'captionZh', 'overviewEn', 'overviewZh',
      'listIntroEn', 'listIntroZh', 'totalValue', 'coveredValue', 'missingValue', 'coverageValue',
    ]) {
      expect(page).toContain(`data-coverage-text="${key}"`);
    }
    for (const stale of [
      'Patch 26.14', '173 champions', '68 champions', '>60.7%</span>', '按上线时间从早到晚排列',
    ]) {
      expect(page).not.toContain(stale);
    }
    expect(page).not.toContain('/img/champions/${c.alias}.png');
    expect(page).not.toContain('prestige-chromas.json');
    expect(page).toContain('<style is:global>');
  });
});
