import { renderSitemap } from '../seo/sitemap';
export function GET() {
  return new Response(renderSitemap(), { headers: { 'content-type': 'application/xml; charset=utf-8' } });
}
