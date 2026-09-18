import { SITE } from './site';
import { blogArticles } from '../blog/articles';
import { SITE_LOCALES, alternateUrls, localizedPath, type Locale } from '../i18n/config';
import { catalog } from '../data/catalog';
import type { ChampionIndexEntry } from '../data/champion-index';
import type { PbeGraph } from '../domain/communitydragon-content';

function escapeXml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

function page(pathname: string, locale: Locale, image?: { location: string; title: string }, lastModified?: string): string {
  const location = new URL(localizedPath(locale, pathname), SITE.origin).toString();
  const imageXml = image
    ? `<image:image><image:loc>${escapeXml(image.location)}</image:loc><image:title>${escapeXml(image.title)}</image:title></image:image>`
    : '';
  const lastModifiedXml = lastModified ? `<lastmod>${escapeXml(lastModified)}</lastmod>` : '';
  const alternateXml = alternateUrls(pathname)
    .map((alternate) => `<xhtml:link rel="alternate" hreflang="${alternate.hreflang}" href="${escapeXml(alternate.url)}"/>`)
    .join('');
  return `<url><loc>${escapeXml(location)}</loc>${lastModifiedXml}${alternateXml}${imageXml}</url>`;
}

export function renderSitemap(championIndex: readonly ChampionIndexEntry[], graph?: PbeGraph): string {
  const fixedPaths = ['/', '/about/', '/privacy/', '/blog/'];
  const requiredIds = [...new Set(catalog.map((chroma) => chroma.heroId))];
  const championPaths = championIndex
    .filter((entry) => requiredIds.includes(entry.id))
    .map((entry) => `/champions/${entry.slug}/`);
  const graphPaths = graph ? [
    '/champions/', '/skins/', '/skinlines/', '/universes/',
    ...graph.champions.map((entry) => `/champions/${entry.slug}/`),
    ...graph.skins.map((entry) => `/skins/${entry.slug}/`),
    ...graph.skinlines.map((entry) => `/skinlines/${entry.slug}/`),
    ...graph.universes.map((entry) => `/universes/${entry.slug}/`),
  ] : [];
  const contentPaths = graph ? graphPaths : championPaths;
  const fixed = SITE_LOCALES.flatMap((locale) => [
    ...fixedPaths.map((pathname) => page(pathname, locale)),
    ...contentPaths.map((pathname) => page(pathname, locale)),
    ...blogArticles.map((article) => page(
      article.href,
      locale,
      {
        location: new URL(article.coverUrl, SITE.origin).toString(),
        title: locale === 'zh-cn' ? article.coverAltZh : article.coverAltEn,
      },
      article.publishedAt,
    )),
  ]);
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml">${fixed.join('')}</urlset>`;
}
