import { describe, expect, it, vi } from 'vitest';
import worker from './index';

function createEnv(rows: Record<string, unknown>[] = []) {
  const all = vi.fn().mockResolvedValue({ results: rows });
  const first = vi.fn().mockResolvedValue({ total: rows.length });
  const bind = vi.fn(() => ({ all, first }));
  const prepare = vi.fn(() => ({ bind }));
  return {
    env: { DB: { prepare }, ASSETS: { fetch: vi.fn() }, RELEASE_ID: 'release-1' },
    prepare, bind,
  };
}

describe('worker', () => {
  it('returns only public API fields with cache and security headers', async () => {
    const fixture = createEnv([{ slug: 'senna-1', name_zh: '赛娜', internal_secret: 'nope', is_new: 1 }]);
    const response = await worker.fetch(new Request('https://example.com/api/chromas'), fixture.env as never);
    const body = await response.json() as { items: Record<string, unknown>[] };
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('public');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('access-control-allow-origin')).toBe('https://chromaart.lol');
    expect(body.items[0]).toEqual({ slug: 'senna-1', nameZh: '赛娜', isNew: true });
    expect(JSON.stringify(body)).not.toContain('internal_secret');
  });

  it('returns 400 for invalid search input and never queries D1', async () => {
    const fixture = createEnv();
    const response = await worker.fetch(new Request('https://example.com/api/chromas?pageSize=100'), fixture.env as never);
    expect(response.status).toBe(400);
    expect(fixture.prepare).not.toHaveBeenCalled();
  });

  it('delegates non-API routes to static assets', async () => {
    const fixture = createEnv();
    fixture.env.ASSETS.fetch.mockResolvedValue(new Response('home'));
    const response = await worker.fetch(new Request('https://example.com/'), fixture.env as never);
    expect(await response.text()).toBe('home');
  });
});
