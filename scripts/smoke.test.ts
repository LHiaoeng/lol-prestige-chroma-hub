import { afterEach, describe, expect, it, vi } from 'vitest';
import { requestExpectedStatus } from './smoke';

afterEach(() => vi.unstubAllGlobals());

describe('production smoke requests', () => {
  it('exports an import-safe expected-status request helper', async () => {
    const fetcher = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      const forbidden = ['/api/chromas', '/data/prestige-chromas.json', '/api/export', '/chromas.json'];
      return new Response('', { status: forbidden.some((path) => url.endsWith(path)) ? 404 : 200 });
    });
    vi.stubGlobal('fetch', fetcher);

    const smoke = await import('./smoke') as Record<string, unknown>;

    expect(smoke.requestExpectedStatus).toBeTypeOf('function');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('aborts a request after the injected timeout', async () => {
    let observedSignal: AbortSignal | undefined;
    const fetcher = vi.fn((_input: string | URL | Request, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      observedSignal = init?.signal as AbortSignal | undefined;
      if (!observedSignal) return reject(new Error('Missing abort signal'));
      observedSignal.addEventListener('abort', () => reject(observedSignal?.reason), { once: true });
    }));
    vi.stubGlobal('fetch', fetcher);
    const request = requestExpectedStatus as (
      url: string,
      expectedStatus: number,
      options: { fetcher: typeof fetch; timeoutMs: number },
    ) => Promise<Response>;

    await expect(request('https://example.test/', 200, { fetcher: fetcher as typeof fetch, timeoutMs: 5 }))
      .rejects.toMatchObject({ name: 'TimeoutError' });
    expect(observedSignal?.aborted).toBe(true);
  });
});
