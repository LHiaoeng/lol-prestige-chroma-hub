import { renderSitemap } from '../seo/sitemap';
import { getChampionIndex } from '../data/champion-index';
import { getCommunityDragonPbeGraph } from '../data/communitydragon-pbe';
export async function GET() {
  return new Response(renderSitemap(await getChampionIndex(), await getCommunityDragonPbeGraph()), { headers: { 'content-type': 'application/xml; charset=utf-8' } });
}
