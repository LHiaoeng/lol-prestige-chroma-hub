import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { AD_SCRIPT_URLS, resolveAdProvider, type AdProvider } from '../src/domain/ad-policy';
import { lolCosmeticCatalogs } from '../src/domain/lol-cosmetics';

export const GOOGLE_TAG_SCRIPT = 'https://www.googletagmanager.com/gtm.js?id=GTM-N2XNGMV2';
export const GOOGLE_TAG_INIT = "gtag('js', new Date());";

function countOccurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

function assertGoogleTag(file: string, html: string): void {
  if (countOccurrences(html, GOOGLE_TAG_SCRIPT) !== 1 || countOccurrences(html, GOOGLE_TAG_INIT) !== 1) {
    throw new Error(`Google tag must appear exactly once: ${file}`);
  }
  const headEnd = html.indexOf('</head>');
  const head = headEnd >= 0 ? html.slice(0, headEnd) : '';
  if (!head.includes(GOOGLE_TAG_SCRIPT) || !head.includes(GOOGLE_TAG_INIT)) {
    throw new Error(`Google tag must be placed in <head>: ${file}`);
  }
}

export function isSensitiveDeploymentArtifact(file: string): boolean {
  return /\.map$/i.test(file)
    || /(^|\/)prestige-chromas\.json$/i.test(file)
    || /(^|\/)(data|assets|migrations?|runtime|communitydragon|remote-media)\//i.test(file)
    || /\.(?:db|sqlite|sqlite3)(?:-(?:wal|shm|journal))?$/i.test(file)
    || /\.sql(?:\.(?:gz|br|zip))?$/i.test(file);
}

const AD_FREE_PATHS = new Set([
  '/about/', '/privacy/', '/editorial-policy/',
  '/champions/', '/skins/', '/skinlines/', '/universes/', '/pbe-additions/',
  '/tft/companions/', '/tft/arenas/',
  ...lolCosmeticCatalogs.map(({ slug }) => `/${slug}/`),
]);

export function auditBuild(root: string, adProvider: AdProvider = resolveAdProvider(process.env.AD_PROVIDER)): string[] {
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
  const runtimeEntityPages = files.filter((file) => /^(?:zh-cn\/)?(?:champions|skins|skinlines|universes)\/(?!detail\/)[^/]+\/index\.html$/.test(file));
  if (runtimeEntityPages.length) throw new Error(`Runtime entity pages must not be published: ${runtimeEntityPages.join(', ')}`);
  const nestedPbeEntityPages = files.filter((file) => /^(?:zh-cn\/)?pbe-additions\/.+\/index\.html$/.test(file));
  if (nestedPbeEntityPages.length) throw new Error(`PBE entity pages must not be published: ${nestedPbeEntityPages.join(', ')}`);
  const jsonArtifacts = files.filter((file) => file.toLowerCase().endsWith('.json'));
  if (jsonArtifacts.length) throw new Error(`JSON source artifacts must not be published: ${jsonArtifacts.join(', ')}`);
  if (!files.includes('index.html') || !files.includes('zh-cn/index.html') || !files.includes('404.html')) throw new Error('Required static pages are missing');
  const fileSet = new Set(files);
  for (const file of files.filter((entry) => entry.endsWith('.html'))) {
    const html = readFileSync(join(root, file), 'utf8');
    if (!html.trim()) throw new Error(`Blank HTML document detected: ${file}`);
    const markup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
    const canonical = markup.match(/<link rel="canonical" href="(https:\/\/chromaart\.lol[^"#]*)"/)?.[1];
    const pathname = canonical ? new URL(canonical).pathname : undefined;
    const adBoundaries = [...markup.matchAll(/data-ad-boundary="([^"]+)"/g)].map((match) => match[1]);
    const adProviders = [...markup.matchAll(/data-ad-provider="([^"]+)"/g)].map((match) => match[1]);
    const adScripts = [...markup.matchAll(/data-ad-script="([^"]+)"/g)].map((match) => match[1]);
    const adInitializers = [...markup.matchAll(/data-ad-init="([^"]+)"/g)].map((match) => match[1]);
    const pageAdSources = Object.values(AD_SCRIPT_URLS).filter((source) => html.includes(source));
    if (file === '404.html') {
      if (/data-ad-/.test(markup) || pageAdSources.length) throw new Error('Advertising is not allowed on the 404 page');
      continue;
    }
    if (adBoundaries.length !== adProviders.length) throw new Error(`Advertising boundary/provider mismatch: ${file}`);
    if (adBoundaries.length !== adScripts.length || adBoundaries.length !== adInitializers.length) throw new Error(`Advertising source/initializer mismatch: ${file}`);
    if (adBoundaries.length > 1) throw new Error(`Multiple advertising slots on one page: ${file}`);
    if (adBoundaries.length && !pathname) throw new Error(`Advertising markup has no canonical page: ${file}`);

    if (pathname) {
      const route = pathname.replace(/^\/zh-cn(?=\/)/, '') || '/';
      const explicitlyAdFree = /<html\b[^>]*\sdata-ads-disabled(?:=""|\s|>)/.test(markup);
      const expectedAd = adProvider !== 'none' && !AD_FREE_PATHS.has(route) && !explicitlyAdFree;
      if (expectedAd && (adBoundaries.length !== 1 || adProviders[0] !== adProvider)) {
        throw new Error(`Page must contain exactly one ${adProvider} advertising slot: ${file}`);
      }
      const expectedSource = adProvider === 'none' ? undefined : AD_SCRIPT_URLS[adProvider];
      const hasOnlySelectedSource = expectedSource
        ? pageAdSources.length === 1 && pageAdSources[0] === expectedSource
        : pageAdSources.length === 0;
      const expectedInitializer = adProvider === 'adsterra' ? 'inline-script' : 'adsbygoogle';
      if (expectedAd && (!hasOnlySelectedSource
        || adScripts[0] !== expectedSource
        || adInitializers[0] !== expectedInitializer)) {
        throw new Error(`Advertising source or initializer does not match ${adProvider}: ${file}`);
      }
      if (!expectedAd && (adBoundaries.length || pageAdSources.length)) throw new Error(`Advertising boundary or source is out of scope: ${file}`);
      if (adProvider === 'adsense' && expectedAd && !html.includes('data-ad-slot=')) {
        throw new Error(`AdSense slot has no ad unit ID: ${file}`);
      }
      if (expectedAd && /data-ad-deferred(?:=""|\s|>)/.test(markup)) {
        throw new Error(`Advertising must load with the page, not wait for runtime content: ${file}`);
      }
    }

    if (!canonical) continue;
    if (file.startsWith('zh-cn/')) continue;
    const counterpart = `zh-cn${pathname === '/' ? '/index.html' : `${pathname}index.html`}`.replace(/^\//, '');
    if (!fileSet.has(counterpart)) {
      throw new Error(`Missing Simplified Chinese counterpart for ${file}: ${counterpart}`);
    }
  }
  for (const file of files.filter((entry) => entry.endsWith('.html'))) {
    const html = readFileSync(join(root, file), 'utf8');
    assertGoogleTag(file, html);
    for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
      if (!/^\/(?:zh-cn\/)?(?:champions|skins|skinlines|universes)(?:\/|$)/.test(href)) continue;
      const pathname = new URL(href, 'https://audit.invalid').pathname;
      const normalized = pathname.endsWith('/') ? pathname : `${pathname}/`;
      const target = `${normalized.slice(1)}index.html`;
      if (!fileSet.has(target)) throw new Error(`Dangling internal IA link in ${file}: ${href}`);
      const fragment = new URL(href, 'https://audit.invalid').hash.slice(1);
      if (fragment) {
        const targetHtml = readFileSync(join(root, target), 'utf8');
        let decodedFragment: string;
        try {
          decodedFragment = decodeURIComponent(fragment);
        } catch {
          throw new Error(`Invalid internal IA link fragment in ${file}: ${href}`);
        }
        if (!targetHtml.includes(`id="${decodedFragment}"`)) {
          throw new Error(`Missing internal IA link anchor in ${file}: ${href}`);
        }
      }
    }
  }
  const sitemap = join(root, 'sitemap.xml');
  if (files.includes('sitemap.xml')) {
    const xml = readFileSync(sitemap, 'utf8');
    const crawlableLocations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    if (crawlableLocations.some((location) => /^\/(?:zh-cn\/)?chromas\//.test(new URL(location).pathname))) {
      throw new Error('Catalog detail pages must not appear in sitemap.xml');
    }
    if (crawlableLocations.some((location) => /^(?:\/zh-cn)?\/(?:champions|skins|skinlines|universes)\/(?!detail\/)[^/]+\/$/.test(new URL(location).pathname))) {
      throw new Error('Runtime entity pages must not appear in sitemap.xml');
    }
  }
  return files;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { console.log(`Audited ${auditBuild(resolve(process.argv[2] || 'dist')).length} files`); } catch (error) { console.error(error); process.exitCode = 1; }
}
