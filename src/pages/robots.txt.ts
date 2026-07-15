export function GET() {
  return new Response('User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: https://chromaart.lol/sitemap.xml\n', { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
