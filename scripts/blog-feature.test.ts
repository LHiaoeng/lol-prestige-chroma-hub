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
    expect(component).toContain('href={older.href}');
    expect(component).toContain('href={newer.href}');
    expect(component).toContain('aria-label=');
    expect(component).toContain('width:min(var(--content-width),calc(100% - (var(--page-gutter) * 2)))');
    expect(component).toContain('grid-template-columns:repeat(2,minmax(0,1fr))');
    expect(component).toContain('@media (max-width:767px)');
    for (const pagePath of [
      'src/pages/blog/what-are-prestige-chromas.astro',
      'src/pages/blog/what-are-chroma-skins.astro',
      'src/pages/blog/what-is-league-of-legends.astro',
    ]) {
      const page = source(pagePath);
      expect(page.match(/<BlogAdjacentNavigation currentSlug=\{article\.slug\} \/>/g)).toHaveLength(1);
    }
  });

  it('links the blog from the header and footer on every page', () => {
    const layout = source('src/layouts/BaseLayout.astro');
    expect(layout.match(/href="\/blog\/"/g)).toHaveLength(2);
    expect(layout).toContain('class="header-blog-link"');
    expect(layout).toContain('data-en="Blog" data-zh="博客"');
    expect(layout).toContain('min-height: var(--touch-target)');
    expect(layout).toContain("ogType?: 'website' | 'article'");
    expect(layout).toContain('const socialImage = new URL(image, SITE.origin).toString()');
    expect(layout).toContain('property="article:published_time"');
    expect(layout).toContain('property="article:modified_time"');
  });

  it('renders a bilingual responsive featured blog list', () => {
    const page = source('src/pages/blog/index.astro');
    expect(page).toContain("'@type': 'CollectionPage'");
    expect(page).toContain('data-language-content="en"');
    expect(page).toContain('data-language-content="zh"');
    expect(page).toContain('<article class="featured-post">');
    expect(page).toContain('blogArticles.map((entry, index)');
    expect(page).toContain('href={entry.href}');
    expect(page).toContain("formatBlogDate(entry.publishedAt, 'en')");
    expect(page).toContain("formatBlogDate(entry.publishedAt, 'zh')");
    expect(page).toContain('data-placeholder="/placeholder.svg"');
    expect(page).toContain('@media (max-width: 1023px)');
    expect(page).toContain('@media (max-width: 767px)');
  });

  it('renders the bilingual chroma history article from portable local media', () => {
    const page = source('src/pages/blog/what-are-chroma-skins.astro');
    expect(page).toContain("'@type': 'BlogPosting'");
    expect(page).toContain("'@type': 'BreadcrumbList'");
    expect(page).toContain("inLanguage: ['en', 'zh']");
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

  it('renders a complete bilingual illustrated article', () => {
    const page = source('src/pages/blog/what-is-league-of-legends.astro');
    expect(page).toContain("'@type': 'BlogPosting'");
    expect(page).toContain("'@type': 'BreadcrumbList'");
    expect(page).toContain("inLanguage: ['en', 'zh']");
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

  it('renders a complete bilingual prestige chroma article', () => {
    const page = source('src/pages/blog/what-are-prestige-chromas.astro');
    expect(page).toContain("'@type': 'BlogPosting'");
    expect(page).toContain("'@type': 'BreadcrumbList'");
    expect(page).toContain("inLanguage: ['en', 'zh']");
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
    expect(page).toContain('href={`/chromas/${chroma.slug}/`}');
    expect(page).toContain('href={`/chromas/${designChroma.slug}/`}');
    expect(page).toContain('href={`/chromas/${cultureChroma.slug}/`}');
    expect(page).toContain('class="chroma-art-link"');
    expect(page).toContain('data-aria-en=');
    expect(page).toContain('data-aria-zh=');
    expect(page.match(/<details>/g)).toHaveLength(12);
  });
});
