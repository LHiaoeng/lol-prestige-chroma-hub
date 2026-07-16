function searchUrl(base: string, parameter: string, keyword: string): string {
  const url = new URL(base);
  url.searchParams.set(parameter, keyword);
  return url.toString();
}

export function skinSpotlightsSearchUrl(keyword: string): string {
  return searchUrl('https://www.youtube.com/c/SkinSpotlights/search', 'query', keyword);
}

export function khadaModelUrl(skinId: number, chromaId?: number): string {
  const url = new URL('https://modelviewer.lol/model-viewer');
  url.searchParams.set('id', String(skinId));
  url.searchParams.set('lang', 'en-US');
  if (chromaId !== undefined) url.searchParams.set('chroma', String(chromaId));
  return url.toString();
}

export function googleSearchUrl(keyword: string): string {
  return searchUrl('https://www.google.com/search', 'q', `LEAGUE OF LEGENDS ${keyword}`);
}
