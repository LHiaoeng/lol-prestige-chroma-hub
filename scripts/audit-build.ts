import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { blogArticles } from '../src/blog/articles';
import { canDisplayAds } from '../src/domain/ad-policy';

export function isSensitiveDeploymentArtifact(file: string): boolean {
  return /\.map$/i.test(file)
    || /(^|\/)prestige-chromas\.json$/i.test(file)
    || /(^|\/)(data|assets|migrations?)\//i.test(file)
    || /\.(?:db|sqlite|sqlite3)(?:-(?:wal|shm|journal))?$/i.test(file)
    || /\.sql(?:\.(?:gz|br|zip))?$/i.test(file);
}

export function auditBuild(root: string): string[] {
  const files: string[] = [];
  const visit = (directory: string) => {
    for (const entry of readdirSync(directory)) {
      const path = join(directory, entry);
      if (statSync(path).isDirectory()) visit(path); else files.push(relative(root, path).replaceAll('\\', '/'));
    }
  };
  visit(root);
  const sensitive = files.filter(isSensitiveDeploymentArtifact);
  if (sensitive.length) throw new Error(`Sensitive deployment artifacts detected: ${sensitive.join(', ')}`);
  if (!files.includes('index.html') || !files.includes('zh-cn/index.html') || !files.includes('404.html')) throw new Error('Required static pages are missing');
  const fileSet = new Set(files);
  const adEligibleSlugs = new Set(blogArticles.filter((article) => article.adEligible).map((article) => article.slug));
  for (const file of files.filter((entry) => entry.endsWith('.html') && entry !== '404.html')) {
    const html = readFileSync(join(root, file), 'utf8');
    if (!html.trim()) throw new Error(`Blank HTML document detected: ${file}`);
    const canonical = html.match(/<link rel="canonical" href="(https:\/\/chromaart\.lol[^"#]*)"/)?.[1];
    const pathname = canonical ? new URL(canonical).pathname : undefined;
    const detailPath = pathname && /^\/(?:zh-cn\/)?chromas\/[^/]+\/$/.test(pathname);
    const adBoundaries = [...html.matchAll(/data-ad-boundary="([^"]+)"/g)].map((match) => match[1]);
    const hasAdScript = html.includes('pagead2.googlesyndication.com') || html.includes('adsbygoogle');

    if (detailPath) {
      if (!/<meta name="robots" content="noindex, nofollow">/.test(html)) {
        throw new Error(`Catalog detail is missing noindex: ${file}`);
      }
      if (adBoundaries.length || hasAdScript) throw new Error(`Catalog detail contains advertising: ${file}`);
    }

    if (adBoundaries.length || hasAdScript) {
      if (!pathname) throw new Error(`Advertising markup has no canonical page: ${file}`);
      for (const placement of adBoundaries) {
        const catalogIndex = placement === 'catalog-index'
          && canDisplayAds('catalog-index')
          && (pathname === '/' || pathname === '/zh-cn/');
        const blogIndex = pathname === '/blog/' || pathname === '/zh-cn/blog/';
        const articleMatch = pathname.match(/^\/(?:zh-cn\/)?blog\/([^/]+)\/$/);
        const editorialArticle = placement === 'editorial-article'
          && canDisplayAds('editorial-article', blogIndex || Boolean(articleMatch && adEligibleSlugs.has(articleMatch[1])))
          && (blogIndex || Boolean(articleMatch));
        if (!catalogIndex && !editorialArticle) throw new Error(`Advertising boundary is out of scope: ${file}`);
      }
      if (!adBoundaries.length) throw new Error(`Advertising script has no explicit boundary: ${file}`);
    }

    if (!canonical) continue;
    if (file.startsWith('zh-cn/')) continue;
    const counterpart = `zh-cn${pathname === '/' ? '/index.html' : `${pathname}index.html`}`.replace(/^\//, '');
    if (!fileSet.has(counterpart)) {
      throw new Error(`Missing Simplified Chinese counterpart for ${file}: ${counterpart}`);
    }
  }
  const sitemap = join(root, 'sitemap.xml');
  if (files.includes('sitemap.xml')) {
    const xml = readFileSync(sitemap, 'utf8');
    const crawlableLocations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    if (crawlableLocations.some((location) => /^\/(?:zh-cn\/)?chromas\//.test(new URL(location).pathname))) {
      throw new Error('Catalog detail pages must not appear in sitemap.xml');
    }
  }
  return files;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { console.log(`Audited ${auditBuild(resolve(process.argv[2] || 'dist')).length} files`); } catch (error) { console.error(error); process.exitCode = 1; }
}
