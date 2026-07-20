import type { Chroma } from '../domain/chroma';
import { imageUrl } from '../domain/chroma';
import { chromaImageAlt } from './chroma-seo';
import { SITE } from './site';
import { blogArticles } from '../blog/articles';

function escapeXml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

function page(location: string, image?: { location: string; title: string }, lastModified?: string): string {
  const imageXml = image
    ? `<image:image><image:loc>${escapeXml(image.location)}</image:loc><image:title>${escapeXml(image.title)}</image:title></image:image>`
    : '';
  const lastModifiedXml = lastModified ? `<lastmod>${escapeXml(lastModified)}</lastmod>` : '';
  return `<url><loc>${escapeXml(location)}</loc>${lastModifiedXml}${imageXml}</url>`;
}

export function renderSitemap(catalog: Chroma[]): string {
  const fixed = [
    page(`${SITE.origin}/`),
    page(`${SITE.origin}/about/`),
    page(`${SITE.origin}/privacy/`),
    page(`${SITE.origin}/blog/`),
    ...blogArticles.map((article) => page(
      `${SITE.origin}${article.href}`,
      {
        location: new URL(article.coverUrl, SITE.origin).toString(),
        title: article.coverAltEn,
      },
      article.publishedAt,
    )),
  ];
  const details = catalog.map((chroma) => page(
    `${SITE.origin}/chromas/${chroma.slug}/`,
    { location: imageUrl(chroma.images.large), title: chromaImageAlt(chroma.nameEn) },
  ));
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${[...fixed, ...details].join('')}</urlset>`;
}
