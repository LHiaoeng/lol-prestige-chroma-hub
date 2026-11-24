import { localizedPath } from './i18n/config';
import { browserLocale, LANGUAGE_COOKIE, LANGUAGE_SWITCH_PATH } from './i18n/language-preference';

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

const privateResponse = { 'Cache-Control': 'private, no-store' };

function switchLanguage(url: URL, form: FormData, referrer: URL | null): Response {
  const locale = form.get('locale');
  const from = form.get('from');
  if ((locale !== 'en' && locale !== 'zh-cn') || typeof from !== 'string' || !from.startsWith('/')) {
    return new Response(null, { status: 400, headers: privateResponse });
  }

  const source = URL.parse(from, url);
  if (!source || source.origin !== url.origin || source.pathname === LANGUAGE_SWITCH_PATH) {
    return new Response(null, { status: 400, headers: privateResponse });
  }
  if (!source.search && referrer?.origin === url.origin && referrer.pathname === source.pathname) {
    source.search = referrer.search;
  }
  const path = localizedPath(locale, source.href);
  const destination = URL.parse(path, url);
  if (!destination || destination.origin !== url.origin || destination.pathname === LANGUAGE_SWITCH_PATH) {
    return new Response(null, { status: 400, headers: privateResponse });
  }

  return new Response(null, {
    status: 303,
    headers: {
      ...privateResponse,
      Location: destination.href,
      'Set-Cookie': `${LANGUAGE_COOKIE}=${locale}; Max-Age=31536000; Path=/; HttpOnly; Secure; SameSite=Lax`,
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const referrer = URL.parse(request.headers.get('Referer') ?? '');
    if (url.pathname === LANGUAGE_SWITCH_PATH) {
      if (request.method !== 'POST') {
        return new Response(null, { status: 405, headers: { ...privateResponse, Allow: 'POST' } });
      }
      if (request.headers.get('Origin') !== url.origin) {
        return new Response(null, { status: 403, headers: privateResponse });
      }
      const form = await request.formData().catch(() => null);
      if (!form) return new Response(null, { status: 400, headers: privateResponse });
      return switchLanguage(url, form, referrer);
    }
    if (url.pathname !== '/' || (request.method !== 'GET' && request.method !== 'HEAD')) {
      return env.ASSETS.fetch(request);
    }

    const sameOrigin = request.headers.get('Sec-Fetch-Site') === 'same-origin' || referrer?.origin === url.origin;
    if (!sameOrigin) {
      const cookie = request.headers.get('Cookie')?.split(';').map((value) => value.trim())
        .find((value) => value.startsWith(`${LANGUAGE_COOKIE}=`))?.slice(LANGUAGE_COOKIE.length + 1);
      const locale = cookie === 'en' || cookie === 'zh-cn' ? cookie : browserLocale(request.headers.get('Accept-Language'));
      if (locale === 'zh-cn') {
        url.pathname = localizedPath(locale, url.pathname);
        return new Response(null, { status: 302, headers: { ...privateResponse, Location: url.href } });
      }
    }

    const asset = await env.ASSETS.fetch(request);
    const response = new Response(asset.body, asset);
    response.headers.set('Cache-Control', privateResponse['Cache-Control']);
    return response;
  },
};
