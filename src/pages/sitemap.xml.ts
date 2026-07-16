import { catalog } from '../data/catalog';
import { renderSitemap } from '../seo/sitemap';
export function GET() {
  return new Response(renderSitemap(catalog), { headers: { 'content-type': 'application/xml; charset=utf-8' } });
}
