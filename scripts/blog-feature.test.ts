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
  });

  it('renders a bilingual responsive featured blog list', () => {
    const page = source('src/pages/blog/index.astro');
    expect(page).toContain("'@type': 'CollectionPage'");
    expect(page).toContain('data-language-content="en"');
    expect(page).toContain('data-language-content="zh"');
    expect(page).toContain('<article class="featured-post">');
    expect(page).toContain('href={article.href}');
    expect(page).toContain('<time datetime={article.publishedAt}>');
    expect(page).toContain('data-placeholder="/placeholder.svg"');
    expect(page).toContain('@media (max-width: 1023px)');
    expect(page).toContain('@media (max-width: 767px)');
  });

  it('renders a complete bilingual illustrated article', () => {
    const page = source('src/pages/blog/what-is-league-of-legends.astro');
    expect(page).toContain("'@type': 'BlogPosting'");
    expect(page).toContain("'@type': 'BreadcrumbList'");
    expect(page.match(/<article class="blog-article"/g)).toHaveLength(2);
    expect(page.match(/<figure>/g)?.length).toBeGreaterThanOrEqual(3);
    expect(page).toContain('data-alt-en=');
    expect(page).toContain('data-alt-zh=');
    expect(page).toContain('loading="lazy"');
    expect(page).toContain('data-placeholder="/placeholder.svg"');
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
