import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('blog feature contract', () => {
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
    expect(page).toContain('What is a chroma skin?');
    expect(page).toContain('什么是炫彩皮肤');
    expect(page).toContain('推出背景');
    expect(page).toContain('皮肤展示');
    expect(page).toContain('购买方式');
    expect(page).toContain('配色方案');
    expect(page).toContain('限时促销');
    expect(page).not.toContain('<h2>基本信息</h2>');
    expect(page).toContain('/individual-purchase-en.png');
    expect(page).toContain('/blue-essence-en.png');
    expect(page.match(/<details>/g)).toHaveLength(16);
    expect(page).toContain('.article-header,.blog-article>section,.blog-article>figure,.comparison,.showcase');
    expect(page).toContain('/images/blog/chroma-history/');
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
    expect(page).toContain("const backgroundChroma = catalog.find((item) => item.rank === 1)");
    expect(page).toContain('<div class="blog-backdrop" aria-hidden="true">');
    expect(page).toContain('<source media="(max-width: 767px)" srcset={imageUrl(backgroundChroma.images.medium)}');
    expect(page).toContain('<img src={imageUrl(backgroundChroma.images.large)} data-fallback={sourceImageUrl(\'large\', backgroundChroma.instanceId)}');
    expect(page).toContain('.blog-page::after');
    expect(page).toContain('.blog-backdrop img');
    expect(page).toMatch(/@media \(max-width: 767px\)[\s\S]*?\.blog-backdrop/);
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
      'Summoner’s Rift and the Nexus',
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
});
