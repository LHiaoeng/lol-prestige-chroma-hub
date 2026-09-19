import type { APIRoute } from 'astro';
import { getCommunityDragonPbeGraph } from '../../data/communitydragon-pbe';
import { buildListingPayload, isListingKind, type ListingKind } from '../../domain/listing-payload';

export const prerender = true;

export function getStaticPaths() {
  return (['champions', 'skins', 'skinlines', 'universes'] as const).map((kind) => ({ params: { kind } }));
}

export const GET: APIRoute = async ({ params }) => {
  const kindParam = params.kind ?? '';
  if (!isListingKind(kindParam)) return new Response('Not Found', { status: 404 });
  const graph = await getCommunityDragonPbeGraph();
  const payload = buildListingPayload(kindParam as ListingKind, graph, 'en');
  return new Response(JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
};
