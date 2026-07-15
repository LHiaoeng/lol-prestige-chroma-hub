import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

const root = process.cwd();
const dist = join(root, 'dist');

describe('static site build', () => {
  beforeAll(() => {
    rmSync(dist, { recursive: true, force: true });
    execFileSync(process.execPath, [join(root, 'node_modules', 'astro', 'bin', 'astro.mjs'), 'build'], { cwd: root, stdio: 'pipe' });
  }, 60_000);

  it('emits the public routes and SEO metadata', () => {
    expect(existsSync(join(dist, 'index.html'))).toBe(true);
    expect(existsSync(join(dist, '404.html'))).toBe(true);
    expect(existsSync(join(dist, 'robots.txt'))).toBe(true);
    expect(existsSync(join(dist, 'sitemap.xml'))).toBe(true);
    const home = readFileSync(join(dist, 'index.html'), 'utf8');
    expect(home).toContain('<link rel="canonical" href="https://chromaart.lol/">');
    expect(home).toContain('application/ld+json');
    expect(home).toContain('data-chroma-list');
    expect(home).toContain('id="catalog-data"');
    expect(home).toContain('data-chroma-card-template');
    expect(home).not.toContain('/api/chromas');
    expect(home).not.toContain('prestige-chromas.json');
  });

  it('does not publish source data or source maps', () => {
    const files = readdirSync(dist, { recursive: true }).map(String);
    expect(files.some((file) => file.endsWith('.map'))).toBe(false);
    expect(files.some((file) => file.includes('prestige-chromas.json'))).toBe(false);
  });

  it('bundles browser scripts instead of publishing the legacy app script', () => {
    const files = readdirSync(dist, { recursive: true }).map(String);
    const html = files
      .filter((file) => file.endsWith('.html'))
      .map((file) => readFileSync(join(dist, file), 'utf8'))
      .join('\n');

    expect(existsSync(join(dist, 'app.js'))).toBe(false);
    expect(html).not.toContain('src="/app.js"');
    expect(files.some((file) => /^_astro[\\/].+\.js$/.test(file))).toBe(true);
  });
});
