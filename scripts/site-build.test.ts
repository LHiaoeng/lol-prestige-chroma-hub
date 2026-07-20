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
    const blog = readFileSync(join(dist, 'blog', 'index.html'), 'utf8');
    const article = readFileSync(join(dist, 'blog', 'what-is-league-of-legends', 'index.html'), 'utf8');
    expect(blog).toContain('<link rel="canonical" href="https://chromaart.lol/blog/">');
    expect(blog).toContain('"@type":"CollectionPage"');
    expect(article).toContain('<link rel="canonical" href="https://chromaart.lol/blog/what-is-league-of-legends/">');
    expect(article).toContain('"@type":"BlogPosting"');
    expect(article).toContain('data-language-content="zh"');
    expect(article).toContain('召唤师峡谷与水晶枢纽');
  });

  it('emits record-specific chroma splash art metadata', () => {
    const sample = catalog[0];
    const detail = readFileSync(join(dist, 'chromas', sample.slug, 'index.html'), 'utf8');
    expect(detail).toContain(`${sample.nameEn} China-Exclusive Chroma Splash Art | LoL Chroma Art`);
    expect(detail).toContain('the Chinese version of League of Legends');
    expect(detail).toContain(`${sample.nameEn} China-Exclusive Chroma Splash Art`);
    expect(detail).toContain('CHINA EXCLUSIVE PRESTIGE CHROMA');
    expect(detail).toContain('Related Chroma Splash Arts');
    expect(detail).toContain('"representativeOfPage":true');
  });

  it('uses factual informational SEO copy', () => {
    const about = readFileSync(join(dist, 'about', 'index.html'), 'utf8');
    expect(about).toContain('<title>What Are Chroma Splash Arts? | LoL Chroma Art</title>');
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
