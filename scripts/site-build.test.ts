import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { isSensitiveDeploymentArtifact } from './audit-build';
import { catalog } from '../src/data/catalog';
import { blogArticles } from '../src/blog/articles';

const root = process.cwd();
const dist = join(root, 'dist');

describe('static site build', () => {
  beforeAll(() => {
    rmSync(dist, { recursive: true, force: true });
    execFileSync(process.execPath, [join(root, 'node_modules', 'astro', 'bin', 'astro.mjs'), 'build'], { cwd: root, stdio: 'pipe' });
  }, 60_000);

  it('emits the public routes and SEO metadata', () => {
    expect(existsSync(join(dist, 'index.html'))).toBe(true);
    expect(existsSync(join(dist, '404.html'))).toBe(true);
    expect(existsSync(join(dist, 'robots.txt'))).toBe(true);
    expect(existsSync(join(dist, 'sitemap.xml'))).toBe(true);
    const home = readFileSync(join(dist, 'index.html'), 'utf8');
    expect(home).toContain('<link rel="canonical" href="https://chromaart.lol/">');
    expect(home).toContain('application/ld+json');
    expect(home).toContain('data-chroma-list');
    expect(home).toContain('id="catalog-data"');
    expect(home).toContain('data-chroma-card-template');
    expect(home).not.toContain('/api/chromas');
    expect(home).not.toContain('prestige-chromas.json');
    expect(home).toContain('<title>LoL China-Exclusive Chroma Splash Arts | LoL Chroma Art</title>');
    expect(home).toContain('<meta property="og:site_name" content="LoL Chroma Art">');
    expect(home).toContain('<meta name="twitter:title" content="LoL China-Exclusive Chroma Splash Arts | LoL Chroma Art">');
    expect(home).toContain('League of Legends');
    expect(home).toContain('China-Exclusive Chroma Splash Arts');
    expect(home).toContain('operated by Tencent');
    expect(home).toContain('"@type":"WebSite"');
    expect(home).toContain('"@type":"CollectionPage"');
    expect(existsSync(join(dist, 'blog', 'index.html'))).toBe(true);
    expect(existsSync(join(dist, 'blog', 'what-is-league-of-legends', 'index.html'))).toBe(true);
    expect(existsSync(join(dist, 'blog', 'what-are-prestige-chromas', 'index.html'))).toBe(true);
    expect(existsSync(join(dist, 'blog', 'champions-without-prestige-chroma', 'index.html'))).toBe(true);
    const blog = readFileSync(join(dist, 'blog', 'index.html'), 'utf8');
    const article = readFileSync(join(dist, 'blog', 'what-is-league-of-legends', 'index.html'), 'utf8');
    const prestigeArticle = readFileSync(join(dist, 'blog', 'what-are-prestige-chromas', 'index.html'), 'utf8');
    const coverageArticle = readFileSync(join(dist, 'blog', 'champions-without-prestige-chroma', 'index.html'), 'utf8');
    expect(blog).toContain('<link rel="canonical" href="https://chromaart.lol/blog/">');
    expect(blog).toContain('"@type":"CollectionPage"');
    expect(article).toContain('<link rel="canonical" href="https://chromaart.lol/blog/what-is-league-of-legends/">');
    expect(article).toContain('"@type":"BlogPosting"');
    expect(article).toContain('data-language-content="zh"');
    expect(article).toContain('召唤师峡谷与水晶枢纽');
    expect(prestigeArticle).toContain('<link rel="canonical" href="https://chromaart.lol/blog/what-are-prestige-chromas/">');
    expect(prestigeArticle).toContain('"@type":"BlogPosting"');
    expect(prestigeArticle).toContain('data-language-content="zh"');
    expect(prestigeArticle).toContain('什么是臻彩');
    expect(coverageArticle).toContain('<link rel="canonical" href="https://chromaart.lol/blog/champions-without-prestige-chroma/">');
    expect(coverageArticle).toContain('data-coverage-list="en"');
    expect(coverageArticle).toContain('data-coverage-list="zh"');
    expect(coverageArticle).toContain('id="champion-coverage-config"');
    expect(coverageArticle).toContain('https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/');
    expect(coverageArticle).toContain('按英文英雄名 A–Z 排列');
    expect(coverageArticle).not.toContain('prestige-chromas.json');
    expect(coverageArticle).not.toContain('按上线时间从早到晚排列');
    const configJson = coverageArticle.match(/<script[^>]*id="champion-coverage-config"[^>]*>([\s\S]*?)<\/script>/)?.[1];
    expect(configJson).toBeDefined();
    expect(Object.keys(JSON.parse(configJson!)).sort()).toEqual(['coveredHeroIds', 'patchVersion']);
    expect(coverageArticle).toContain('.champion-list li{');
    expect(coverageArticle).not.toMatch(/\.champion-list\[data-astro-cid-[^\]]+\] li\[data-astro-cid-/);
  });

  it('emits record-specific chroma splash art metadata', () => {
    const sample = catalog[0];
    const detail = readFileSync(join(dist, 'chromas', sample.slug, 'index.html'), 'utf8');
    expect(detail).toContain(`${sample.nameEn} China-Exclusive Chroma Splash Art | LoL Chroma Art`);
    expect(detail).toContain('the Chinese version of League of Legends');
    expect(detail).toContain(`${sample.nameEn} China-Exclusive Chroma Splash Art`);
    expect(detail).toContain('Click the image to preview');
    expect(detail).toContain('点击图片预览');
    expect(detail).toContain('Related Chroma Splash Arts');
    expect(detail).toContain('"representativeOfPage":true');
  });

  it('uses factual informational SEO copy', () => {
    const home = readFileSync(join(dist, 'index.html'), 'utf8');
    const about = readFileSync(join(dist, 'about', 'index.html'), 'utf8');
    expect(home).toContain('“China Exclusive” describes the standalone splash art shown on the Chinese League of Legends server—not necessarily the regional availability of the chroma itself.');
    expect(home).toContain('“中国服专属”指独立炫彩原画在《英雄联盟》中国服务器中提供，并不表示该炫彩本身一定仅限中国服务器。');
    expect(about).toContain('<title>What Are Chroma Splash Arts? | LoL Chroma Art</title>');
    expect(about).toContain('“China Exclusive” describes the standalone splash art shown on the Chinese League of Legends server—not necessarily the regional availability of the chroma itself.');
    expect(about).toContain('“中国服专属”指独立炫彩原画在《英雄联盟》中国服务器中提供，并不表示该炫彩本身一定仅限中国服务器。');
    expect(about).toContain("Most chromas reuse their base skin's splash art");
    expect(about).toContain('operated by Tencent');
    expect(about).toContain('Availability and release timing vary by event and patch');
    expect(about).not.toContain('will likely be priced higher');
    expect(about).not.toContain('Players should prepare');
  });

  it('publishes a bilingual privacy policy for future Google AdSense use', () => {
    const privacy = readFileSync(join(dist, 'privacy', 'index.html'), 'utf8');
    expect(privacy).toContain('<title>Privacy Policy | LoL Chroma Art</title>');
    expect(privacy).toContain('Google AdSense');
    expect(privacy).toContain('adssettings.google.com');
    expect(privacy).toContain('data-language-content="zh"');
    expect(privacy).toContain('href="mailto:lolchromaart@outlook.com"');
    expect(privacy).not.toContain('github.com/LHiaoeng/lol-prestige-chroma-hub/issues');

    const home = readFileSync(join(dist, 'index.html'), 'utf8');
    const header = home.match(/<header[\s\S]*?<\/header>/)?.[0] ?? '';
    const footer = home.match(/<footer[\s\S]*?<\/footer>/)?.[0] ?? '';
    expect(header).not.toContain('href="/about/"');
    expect(header).not.toContain('href="/privacy/"');
    expect(footer).toContain('href="/about/"');
    expect(footer).toContain('href="/privacy/"');
    expect(header).toContain('href="/blog/"');
    expect(footer).toContain('href="/blog/"');
    expect(footer).toContain('class="footer-separator" aria-hidden="true"');
  });

  it('emits one image sitemap entry per canonical catalog page', () => {
    const sitemap = readFileSync(join(dist, 'sitemap.xml'), 'utf8');
    const expectedImageCount = catalog.length + blogArticles.length;
    expect(sitemap.match(/<image:image>/g)).toHaveLength(expectedImageCount);
    expect(sitemap.match(/<image:loc>/g)).toHaveLength(expectedImageCount);
    expect(sitemap).toContain(`<loc>https://chromaart.lol/chromas/${catalog[0].slug}/</loc>`);
    expect(sitemap).not.toContain(`<loc>https://chromaart.lol/chromas/${catalog[0].skinId}/</loc>`);
  });

  it('does not publish source data or source maps', () => {
    const files = readdirSync(dist, { recursive: true }).map(String);
    expect(files.some((file) => file.endsWith('.map'))).toBe(false);
    expect(files.some((file) => file.includes('prestige-chromas.json'))).toBe(false);
  });

  it('does not publish API routes or database artifacts', () => {
    const files = readdirSync(dist, { recursive: true }).map(String);
    const deployedCode = files
      .filter((file) => /\.(?:html|js)$/i.test(file))
      .map((file) => readFileSync(join(dist, file), 'utf8'))
      .join('\n');

    expect(files.some((file) => /(^|[\\/])api([\\/]|$)/i.test(file))).toBe(false);
    expect(files.some((file) => isSensitiveDeploymentArtifact(file.replaceAll('\\', '/')))).toBe(false);
    expect(deployedCode).not.toContain('/api/');
  });

  it('bundles browser scripts instead of publishing the legacy app script', () => {
    const files = readdirSync(dist, { recursive: true }).map(String);
    const html = files
      .filter((file) => file.endsWith('.html'))
      .map((file) => readFileSync(join(dist, file), 'utf8'))
      .join('\n');

    expect(existsSync(join(dist, 'app.js'))).toBe(false);
    expect(html).not.toContain('src="/app.js"');
    expect(files.some((file) => /^_astro[\\/].+\.js$/.test(file))).toBe(true);
  });
});
