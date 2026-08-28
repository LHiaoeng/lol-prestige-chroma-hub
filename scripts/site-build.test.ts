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
    expect(home).toContain('<html lang="en"');
    expect(home).toContain('<link rel="canonical" href="https://chromaart.lol/">');
    expect(home).toContain('<link rel="alternate" hreflang="en" href="https://chromaart.lol/">');
    expect(home).toContain('<link rel="alternate" hreflang="zh-CN" href="https://chromaart.lol/zh-cn/">');
    expect(home).toContain('<link rel="alternate" hreflang="x-default" href="https://chromaart.lol/">');
    expect(home).toContain('<meta property="og:locale" content="en_US">');
    expect(home).toContain('<meta property="og:locale:alternate" content="zh_CN">');
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
    expect(home).toContain('"@type":"WebSite"');
    expect(home).toContain('"@type":"CollectionPage"');
    expect(home).toContain('data-ad-boundary="catalog-index"');
    expect(home).toContain('pagead2.googlesyndication.com');
    expect(existsSync(join(dist, 'blog', 'index.html'))).toBe(true);
    expect(existsSync(join(dist, 'blog', 'kaisa-prestige-chroma', 'index.html'))).toBe(true);
    expect(existsSync(join(dist, 'blog', 'what-is-league-of-legends', 'index.html'))).toBe(true);
    expect(existsSync(join(dist, 'blog', 'what-are-prestige-chromas', 'index.html'))).toBe(true);
    expect(existsSync(join(dist, 'blog', 'champions-without-prestige-chroma', 'index.html'))).toBe(true);
    expect(existsSync(join(dist, 'blog', 'top-2-prestige-chroma-champions', 'index.html'))).toBe(true);
    expect(existsSync(join(dist, 'blog', 'blue-porcelain-prestige-chromas', 'index.html'))).toBe(true);
    expect(existsSync(join(dist, 'blog', 'patch-26-16-prestige-chromas', 'index.html'))).toBe(true);
    expect(existsSync(join(dist, 'blog', 'patch-26-17-prestige-chromas', 'index.html'))).toBe(true);
    expect(existsSync(join(dist, 'blog', 'challenger-mayhem-jax-prestige-chroma', 'index.html'))).toBe(true);
    expect(existsSync(join(dist, 'blog', 'lucky-gate-porcelain-charm-202608', 'index.html'))).toBe(true);
    expect(existsSync(join(dist, 'blog', 'joy-club-peak-gala-202607', 'index.html'))).toBe(true);
    expect(existsSync(join(dist, 'blog', 'joy-club-peak-gala-202606', 'index.html'))).toBe(true);
    expect(existsSync(join(dist, 'zh-cn', 'blog', 'joy-club-peak-gala-202607', 'index.html'))).toBe(true);
    expect(existsSync(join(dist, 'zh-cn', 'blog', 'joy-club-peak-gala-202606', 'index.html'))).toBe(true);
    expect(existsSync(join(dist, 'blog', 'lucky-gate-petals-of-spring-chromas-202607', 'index.html'))).toBe(true);
    expect(existsSync(join(dist, 'zh-cn', 'blog', 'lucky-gate-petals-of-spring-chromas-202607', 'index.html'))).toBe(true);
    expect(existsSync(join(dist, 'zh-cn', 'blog', 'patch-26-17-prestige-chromas', 'index.html'))).toBe(true);
    const blog = readFileSync(join(dist, 'blog', 'index.html'), 'utf8');
    const article = readFileSync(join(dist, 'blog', 'what-is-league-of-legends', 'index.html'), 'utf8');
    const eventArticle = readFileSync(join(dist, 'blog', 'challenger-mayhem-jax-prestige-chroma', 'index.html'), 'utf8');
    const petalsArticle = readFileSync(join(dist, 'blog', 'lucky-gate-petals-of-spring-chromas-202607', 'index.html'), 'utf8');
    const prestigeArticle = readFileSync(join(dist, 'blog', 'what-are-prestige-chromas', 'index.html'), 'utf8');
    const kaisaArticle = readFileSync(join(dist, 'blog', 'kaisa-prestige-chroma', 'index.html'), 'utf8');
    expect(kaisaArticle).toContain('<link rel="canonical" href="https://chromaart.lol/blog/kaisa-prestige-chroma/">');
    expect(kaisaArticle).toContain('"@type":"BlogPosting"');
    expect(kaisaArticle).not.toContain('卡莎与臻彩');
    const coverageArticle = readFileSync(join(dist, 'blog', 'champions-without-prestige-chroma', 'index.html'), 'utf8');
    expect(blog).toContain('<link rel="canonical" href="https://chromaart.lol/blog/">');
    expect(blog).toContain('"@type":"CollectionPage"');
    expect(article).toContain('<link rel="canonical" href="https://chromaart.lol/blog/what-is-league-of-legends/">');
    expect(article).toContain('"@type":"BlogPosting"');
    expect(article).toContain('data-ad-boundary="editorial-article"');
    expect(article).toContain('pagead2.googlesyndication.com');
    expect(eventArticle).toContain('data-ad-boundary="editorial-article"');
    expect(eventArticle).toContain('pagead2.googlesyndication.com');
    expect(petalsArticle).toContain('<link rel="canonical" href="https://chromaart.lol/blog/lucky-gate-petals-of-spring-chromas-202607/">');
    expect(petalsArticle).toContain('Lucky Gate: Three Petals of Spring Prestige Chromas');
    expect(petalsArticle).toContain('Petals of Spring Lillia (Emerald)');
    expect(petalsArticle).toContain('15850902128487429757');
    expect(blog).toContain('data-ad-boundary="editorial-article"');
    expect(blog).toContain('pagead2.googlesyndication.com');
    expect(article).not.toContain('召唤师峡谷与水晶枢纽');
    expect(prestigeArticle).toContain('<link rel="canonical" href="https://chromaart.lol/blog/what-are-prestige-chromas/">');
    expect(prestigeArticle).toContain('"@type":"BlogPosting"');
    expect(prestigeArticle).not.toContain('什么是臻彩');
    expect(coverageArticle).toContain('<link rel="canonical" href="https://chromaart.lol/blog/champions-without-prestige-chroma/">');
    expect(coverageArticle).toContain('data-coverage-list="en"');
    expect(coverageArticle).not.toContain('data-coverage-list="zh"');
    expect(coverageArticle).toContain('id="champion-coverage-config"');
    expect(coverageArticle).toContain('https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/');
    expect(coverageArticle).not.toContain('按英文英雄名 A–Z 排列');
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
    expect(detail).not.toContain('点击图片预览');
    expect(detail).toContain('Related Chroma Splash Arts');
    expect(detail).toContain('"representativeOfPage":true');
    expect(detail).toContain('<meta name="robots" content="noindex, nofollow">');
    expect(detail).not.toContain('data-ad-boundary=');
    expect(detail).not.toContain('pagead2.googlesyndication.com');
  });

  it('uses factual informational SEO copy', () => {
    const home = readFileSync(join(dist, 'index.html'), 'utf8');
    const chineseHome = readFileSync(join(dist, 'zh-cn', 'index.html'), 'utf8');
    const about = readFileSync(join(dist, 'about', 'index.html'), 'utf8');
    const chineseAbout = readFileSync(join(dist, 'zh-cn', 'about', 'index.html'), 'utf8');
    expect(home).toContain('“China Exclusive” describes the standalone Prestige Chroma splash art provided on the League of Legends China Server—not necessarily the regional availability of the chroma itself.');
    expect(home).not.toContain('“中国服专属”指中国大陆服为臻彩单独提供的臻彩原画，并不表示对应炫彩一定仅限中国大陆服。');
    expect(chineseHome).toContain('“中国服专属”指中国大陆服为臻彩单独提供的臻彩原画，并不表示对应炫彩一定仅限中国大陆服。');
    expect(about).toContain('<title>What Are Chroma Splash Arts? | LoL Chroma Art</title>');
    expect(about).toContain('“China Exclusive” describes the standalone Prestige Chroma splash art provided on the League of Legends China Server—not necessarily the regional availability of the chroma itself.');
    expect(about).not.toContain('“中国服专属”指中国大陆服为臻彩单独提供的臻彩原画，并不表示对应炫彩一定仅限中国大陆服。');
    expect(chineseAbout).toContain('<title>什么是《英雄联盟》中国服炫彩原画？ | LoL Chroma Art</title>');
    expect(chineseAbout).toContain('“中国服专属”指中国大陆服为臻彩单独提供的臻彩原画，并不表示对应炫彩一定仅限中国大陆服。');
    expect(about).toContain("Most chromas reuse their base skin's splash art");
    expect(about).toContain('operated by Tencent');
    expect(about).toContain('Availability and release timing vary by event and patch');
    expect(about).not.toContain('will likely be priced higher');
    expect(about).not.toContain('Players should prepare');
  });

  it('emits Simplified Chinese canonical routes as server-rendered pages', () => {
    const sample = catalog[0];
    const chineseHome = readFileSync(join(dist, 'zh-cn', 'index.html'), 'utf8');
    const chineseDetail = readFileSync(join(dist, 'zh-cn', 'chromas', sample.slug, 'index.html'), 'utf8');
    const chineseBlog = readFileSync(join(dist, 'zh-cn', 'blog', 'index.html'), 'utf8');
    const chineseKaisa = readFileSync(join(dist, 'zh-cn', 'blog', 'kaisa-prestige-chroma', 'index.html'), 'utf8');
    const chineseEditorial = readFileSync(join(dist, 'zh-cn', 'blog', 'what-is-league-of-legends', 'index.html'), 'utf8');
    expect(chineseKaisa).toContain('<html lang="zh-CN"');
    expect(chineseKaisa).toContain('卡莎与臻彩');
    expect(chineseKaisa).not.toContain('data-language-content="en"');
    const chineseArticle = readFileSync(join(dist, 'zh-cn', 'blog', 'what-is-league-of-legends', 'index.html'), 'utf8');
    const chineseCoverage = readFileSync(join(dist, 'zh-cn', 'blog', 'champions-without-prestige-chroma', 'index.html'), 'utf8');
    expect(chineseHome).toContain('<html lang="zh-CN"');
    expect(chineseHome).toContain('<link rel="canonical" href="https://chromaart.lol/zh-cn/">');
    expect(chineseHome).toContain('英雄联盟国服');
    expect(chineseHome).toContain('data-ad-boundary="catalog-index"');
    expect(chineseHome).not.toContain('data-language-content="en"');
    expect(chineseDetail).toContain(`<link rel="canonical" href="https://chromaart.lol/zh-cn/chromas/${sample.slug}/">`);
    expect(chineseDetail).toContain(`${sample.nameZh} 中国服专属炫彩原画 | LoL Chroma Art`);
    expect(chineseDetail).toContain('<meta name="robots" content="noindex, nofollow">');
    expect(chineseDetail).not.toContain('data-ad-boundary=');
    expect(chineseEditorial).toContain('data-ad-boundary="editorial-article"');
    expect(chineseBlog).toContain('data-ad-boundary="editorial-article"');
    expect(chineseDetail).toContain(`href="/zh-cn/chromas/`);
    expect(chineseBlog).toContain('<link rel="canonical" href="https://chromaart.lol/zh-cn/blog/">');
    expect(chineseBlog).toContain('峡谷内外的故事');
    expect(chineseBlog).toContain('href="/zh-cn/blog/what-is-league-of-legends/"');
    expect(chineseArticle).toContain('<html lang="zh-CN"');
    expect(chineseArticle).toContain('召唤师峡谷与水晶枢纽');
    expect(chineseArticle).not.toContain('data-language-content="en"');
    expect(chineseCoverage).toContain('data-coverage-list="zh"');
    expect(chineseCoverage).not.toContain('data-coverage-list="en"');
  });

  it('removes list indentation from blog chroma grids', () => {
    const styles = readFileSync(join(root, 'src', 'styles', 'global.css'), 'utf8');
    const grid = readFileSync(join(root, 'src', 'components', 'BlogChromaGrid.astro'), 'utf8');
    expect(styles).toContain('.blog-article ul.chroma-grid{padding-left:0}');
    expect(grid).toContain('padding:0');
    expect(grid).toContain('grid-template-columns:repeat(var(--blog-chroma-columns)');
  });

  it('publishes bilingual maintenance details for all six evergreen guides', () => {
    const evergreenGuideSlugs = [
      'what-is-league-of-legends',
      'what-are-chroma-skins',
      'what-are-prestige-chromas',
      'kaisa-prestige-chroma',
      'champion-most-prestige-chromas',
      'champions-without-prestige-chroma',
    ];

    for (const slug of evergreenGuideSlugs) {
      for (const localePrefix of ['', 'zh-cn']) {
        const article = readFileSync(join(dist, localePrefix, 'blog', slug, 'index.html'), 'utf8');
        expect(article, `${localePrefix || 'en'} ${slug}`).toContain('data-article-maintenance');
        expect(article, `${localePrefix || 'en'} ${slug}`).toContain('data-article-author');
        expect(article, `${localePrefix || 'en'} ${slug}`).toContain('data-article-updated');
        expect(article, `${localePrefix || 'en'} ${slug}`).toContain('data-article-sources');
        expect(article, `${localePrefix || 'en'} ${slug}`).toContain('data-article-corrections');
        expect(article, `${localePrefix || 'en'} ${slug}`).toContain('data-article-related');
        expect(article, `${localePrefix || 'en'} ${slug}`).toContain(localePrefix ? 'BreadJ 与 LoL Chroma Art 编辑团队' : 'BreadJ and the LoL Chroma Art editorial team');
        expect(article, `${localePrefix || 'en'} ${slug}`).toContain('href="mailto:lolchromaart@outlook.com?subject=LoL%20Chroma%20Art%20correction"');
        expect(article, `${localePrefix || 'en'} ${slug}`).toContain(`href="/${localePrefix ? `${localePrefix}/` : ''}editorial-policy/"`);

        const updatedAt = article.match(/data-article-updated[\s\S]*?<time datetime="([^"]+)"/)?.[1];
        expect(updatedAt, `${localePrefix || 'en'} ${slug} review date`).toBeDefined();
        expect(article, `${localePrefix || 'en'} ${slug} Open Graph review date`).toContain(`<meta property="article:modified_time" content="${updatedAt}">`);
        expect(article, `${localePrefix || 'en'} ${slug} structured review date`).toContain(`"dateModified":"${updatedAt}"`);

        const sources = article.match(/data-article-sources[\s\S]*?<\/ul>/)?.[0] ?? '';
        expect(sources, `${localePrefix || 'en'} ${slug} sources`).toContain('<a ');
        const related = article.match(/data-article-related[\s\S]*?<\/ul>/)?.[0] ?? '';
        expect(related.match(/<a /g), `${localePrefix || 'en'} ${slug} related guides`).toHaveLength(2);
      }
    }
  });

  it('supports legacy numeric chroma detail URLs in Simplified Chinese', () => {
    const chroma = catalog.find((item) => item.skinId === 147063);
    expect(chroma).toBeDefined();
    const numericDetail = readFileSync(join(dist, 'zh-cn', 'chromas', '147063', 'index.html'), 'utf8');
    expect(numericDetail).toContain(`<link rel="canonical" href="https://chromaart.lol/zh-cn/chromas/${chroma!.slug}/">`);
    expect(numericDetail).toContain(`${chroma!.nameZh} 中国服专属炫彩原画 | LoL Chroma Art`);
  });

  it('publishes separate localized privacy policies for future Google AdSense use', () => {
    const privacy = readFileSync(join(dist, 'privacy', 'index.html'), 'utf8');
    const chinesePrivacy = readFileSync(join(dist, 'zh-cn', 'privacy', 'index.html'), 'utf8');
    expect(privacy).toContain('<title>Privacy Policy | LoL Chroma Art</title>');
    expect(privacy).toContain('Google AdSense');
    expect(privacy).toContain('adssettings.google.com');
    expect(privacy).not.toContain('隐私说明');
    expect(chinesePrivacy).toContain('<title>隐私说明 | LoL Chroma Art</title>');
    expect(chinesePrivacy).toContain('Google AdSense');
    expect(chinesePrivacy).toContain('href="mailto:lolchromaart@outlook.com"');
    expect(privacy).toContain('href="mailto:lolchromaart@outlook.com"');
    expect(privacy).not.toContain('github.com/LHiaoeng/lol-prestige-chroma-hub/issues');

    const home = readFileSync(join(dist, 'index.html'), 'utf8');
    const header = home.match(/<header[\s\S]*?<\/header>/)?.[0] ?? '';
    const footer = home.match(/<footer[\s\S]*?<\/footer>/)?.[0] ?? '';
    expect(header).toContain('href="/zh-cn/"');
    expect(header).toContain('hreflang="zh-CN"');
    expect(header).not.toContain('href="/about/"');
    expect(header).not.toContain('href="/privacy/"');
    expect(footer).toContain('href="/about/"');
    expect(footer).toContain('href="/privacy/"');
    expect(header).toContain('href="/blog/"');
    expect(footer).toContain('href="/blog/"');
    expect(footer).toContain('class="footer-separator" aria-hidden="true"');
  });

  it('publishes bilingual editorial trust pages and links them from public content', () => {
    const policy = readFileSync(join(dist, 'editorial-policy', 'index.html'), 'utf8');
    const chinesePolicy = readFileSync(join(dist, 'zh-cn', 'editorial-policy', 'index.html'), 'utf8');
    const article = readFileSync(join(dist, 'blog', 'what-are-prestige-chromas', 'index.html'), 'utf8');
    const chineseArticle = readFileSync(join(dist, 'zh-cn', 'blog', 'what-are-prestige-chromas', 'index.html'), 'utf8');
    const home = readFileSync(join(dist, 'index.html'), 'utf8');
    expect(policy).toContain('<title>Editorial Policy &amp; Sources | LoL Chroma Art</title>');
    expect(policy).toContain('Maintained by BreadJ and the LoL Chroma Art editorial team');
    expect(policy).toContain('the League of Legends China Server, operated by Tencent');
    expect(policy).toContain('Sources and verification');
    expect(policy).toContain('Corrections and updates');
    expect(policy).toContain('href="mailto:lolchromaart@outlook.com?subject=LoL%20Chroma%20Art%20correction"');
    expect(policy).not.toContain('data-ad-boundary=');
    expect(policy).not.toContain('pagead2.googlesyndication.com');
    expect(chinesePolicy).toContain('<title>作者与编辑说明 | LoL Chroma Art</title>');
    expect(chinesePolicy).toContain('维护主体：BreadJ 与 LoL Chroma Art 编辑团队');
    expect(chinesePolicy).toContain('资料来源与核验方式');
    expect(chinesePolicy).toContain('纠错与更新');
    expect(chinesePolicy).not.toContain('data-ad-boundary=');
    expect(article).toContain('href="/editorial-policy/"');
    expect(chineseArticle).toContain('href="/zh-cn/editorial-policy/"');
    expect(article).toContain('min-height:var(--touch-target)');
    expect(home).toContain('href="/editorial-policy/"');
  });

  it('keeps the 404 page out of the localized canonical index', () => {
    const notFound = readFileSync(join(dist, '404.html'), 'utf8');
    expect(notFound).toContain('<meta name="robots" content="noindex, nofollow">');
    expect(notFound).not.toContain('rel="canonical"');
    expect(notFound).not.toContain('hreflang=');
    expect(notFound).toContain('href="/"');
    expect(notFound).toContain('href="/zh-cn/"');
  });

  it('emits one image sitemap entry per canonical catalog page', () => {
    const sitemap = readFileSync(join(dist, 'sitemap.xml'), 'utf8');
    const expectedImageCount = blogArticles.length * 2;
    expect(sitemap.match(/<image:image>/g)).toHaveLength(expectedImageCount);
    expect(sitemap.match(/<image:loc>/g)).toHaveLength(expectedImageCount);
    expect(sitemap).not.toContain(`<loc>https://chromaart.lol/chromas/${catalog[0].slug}/</loc>`);
    expect(sitemap).not.toContain(`<loc>https://chromaart.lol/zh-cn/chromas/${catalog[0].slug}/</loc>`);
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
