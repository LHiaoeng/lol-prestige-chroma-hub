import { describe, expect, it, vi } from 'vitest';
import { browserLocale, LANGUAGE_SWITCH_PATH } from './i18n/language-preference';
import worker from './worker';

const origin = 'https://chromaart.lol';

function fetchPage(path: string, init?: RequestInit) {
  const request = new Request(new URL(path, origin), init);
  const asset = vi.fn(async () => new Response('Static HTML', { headers: { 'Cache-Control': 'public' } }));
  return { fetch: worker.fetch(request, { ASSETS: { fetch: asset } }), asset, request };
}

function submitLanguage(locale: string, from: string, headers: HeadersInit = { Origin: origin }) {
  return fetchPage(LANGUAGE_SWITCH_PATH, { method: 'POST', headers, body: new URLSearchParams({ locale, from }) });
}

describe('language negotiation', () => {
  it.each([
    [null, 'en'],
    ['*, invalid_tag', 'en'],
    ['en-US;q=0.5, zh-CN;q=0.9', 'zh-cn'],
    ['en-GB, zh-CN', 'en'],
    ['zh-SG, en', 'zh-cn'],
    ['zh', 'zh-cn'],
    ['zh-Hans-TW', 'zh-cn'],
    ['zh-Hant-CN, zh-TW, zh-HK, zh-MO, en;q=0.5', 'en'],
    ['zh-Hant, fr, zh-CN;q=0.5', 'zh-cn'],
    ['zh-CN;q=0, en;q=0.5', 'en'],
    ['zh-CN;q=invalid, zh-SG;q=0, fr', 'en'],
  ] as const)('maps %s to %s', (header, locale) => {
    expect(browserLocale(header)).toBe(locale);
  });

  it('redirects an external homepage visit with its query before loading HTML', async () => {
    const { fetch, asset } = fetchPage('/?utm_source=example', {
      headers: { 'Accept-Language': 'zh-CN', Referer: 'https://example.org/' },
    });
    const response = await fetch;
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe(`${origin}/zh-cn/?utm_source=example`);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(response.headers.has('Set-Cookie')).toBe(false);
    expect(asset).not.toHaveBeenCalled();
  });

  it.each([
    ['en', 'zh-CN', 200],
    ['zh-cn', 'en-US', 302],
    ['invalid', 'zh-CN', 302],
  ] as const)('applies saved %s before %s for an entry without navigation signals', async (locale, language, status) => {
    const { fetch } = fetchPage('/', { headers: { Cookie: `other=1; site-language=${locale}`, 'Accept-Language': language } });
    expect((await fetch).status).toBe(status);
  });

  it.each([
    { 'Sec-Fetch-Site': 'same-origin' },
    { Referer: `${origin}/blog/` },
  ] as Record<string, string>[])('honors same-origin navigation with %o', async (headers) => {
    const { fetch } = fetchPage('/', { headers: { ...headers, Cookie: 'site-language=zh-cn' } });
    const response = await fetch;
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(await response.text()).toBe('Static HTML');
  });

  it.each(['/zh-cn/', '/blog/', '/logo.svg', '/missing/'])('passes through %s to static assets', async (path) => {
    const { fetch, asset, request } = fetchPage(path, { headers: { 'Accept-Language': 'zh-CN' } });
    expect((await fetch).headers.get('Cache-Control')).toBe('public');
    expect(asset).toHaveBeenCalledWith(request);
  });

  it('serves the English homepage without language signals', async () => {
    expect((await fetchPage('/').fetch).status).toBe(200);
  });
});

describe('manual language switch', () => {
  it('writes a one-year cookie and redirects to the corresponding page with the query and fragment', async () => {
    const response = await submitLanguage('zh-cn', '/skins/detail/?id=103001#artwork').fetch;
    expect(response.status).toBe(303);
    expect(response.headers.get('Location')).toBe(`${origin}/zh-cn/skins/detail/?id=103001#artwork`);
    expect(response.headers.get('Set-Cookie')).toBe('site-language=zh-cn; Max-Age=31536000; Path=/; HttpOnly; Secure; SameSite=Lax');
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  });

  it('uses the same-page referrer query on native form submissions', async () => {
    const response = await submitLanguage('en', '/zh-cn/skins/detail/', {
      Origin: origin,
      Referer: `${origin}/zh-cn/skins/detail/?id=103001`,
    }).fetch;
    expect(response.headers.get('Location')).toBe(`${origin}/skins/detail/?id=103001`);
    expect(response.headers.get('Set-Cookie')).toMatch(/^site-language=en;/);
  });

  it.each(['//example.org/', '/\\example.org/', '/zh-cn//example.org/', '/_language/'])('rejects invalid switch destinations from %s', async (from) => {
    const response = await submitLanguage('en', from).fetch;
    expect(response.status).toBe(400);
    expect(response.headers.has('Set-Cookie')).toBe(false);
  });

  it('requires a same-origin POST with a supported locale', async () => {
    expect((await fetchPage(LANGUAGE_SWITCH_PATH).fetch).status).toBe(405);
    expect((await submitLanguage('en', '/', { Origin: 'https://example.org' }).fetch).status).toBe(403);
    expect((await submitLanguage('zh-tw', '/').fetch).status).toBe(400);
  });
});
