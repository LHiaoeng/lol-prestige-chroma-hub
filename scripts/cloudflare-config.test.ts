import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const stripJsonComments = (jsonc: string): string => {
  const stringOrComment = /("(?:\\.|[^"\\])*")|\/\/[^\r\n]*|\/\*[\s\S]*?\*\//g;
  return jsonc.replace(stringOrComment, (match, quotedString: string | undefined) =>
    quotedString ?? match.replace(/[^\r\n]/g, ' '),
  );
};

const readJson = (path: string) =>
  JSON.parse(stripJsonComments(readFileSync(path, 'utf8'))) as Record<string, unknown>;

describe('Cloudflare static deployment configuration', () => {
  it('parses JSONC comments without stripping URL-like string content', () => {
    const root = mkdtempSync(join(tmpdir(), 'jsonc-'));
    const path = join(root, 'config.jsonc');
    writeFileSync(path, `{
      // line comment
      "schema": "https://example.com/schema.json",
      /* block comment */
      "enabled": true
    }`);

    try {
      expect(readJson(path)).toEqual({
        schema: 'https://example.com/schema.json',
        enabled: true,
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('runs language selection only for the homepage and preference endpoint', () => {
    const wrangler = readJson('wrangler.jsonc');

    expect(wrangler.name).toBe('lol-prestige-chroma-hub');
    expect(wrangler.compatibility_date).toBeTruthy();
    expect(wrangler.assets).toEqual({
      directory: './dist',
      not_found_handling: '404-page',
      binding: 'ASSETS',
      run_worker_first: ['/', '/_language/'],
    });
    expect(wrangler.main).toBe('./src/worker.ts');
    expect(wrangler).not.toHaveProperty('d1_databases');
    expect(wrangler).not.toHaveProperty('vars');
  });

  it('builds a release locally and keeps import and smoke commands', () => {
    const packageJson = readJson('package.json');
    const scripts = packageJson.scripts as Record<string, string>;

    expect(scripts['release:build']).toBe(
      'pnpm test && pnpm typecheck && pnpm data:validate && pnpm build && pnpm audit:build',
    );
    expect(scripts).not.toHaveProperty('release:prepare');
    expect(scripts).not.toHaveProperty('r2:sync');
    expect(scripts).not.toHaveProperty('cloudflare:init');
    expect(scripts).toHaveProperty('data:import');
    expect(scripts).toHaveProperty('smoke');
    expect(packageJson.devDependencies).not.toHaveProperty('@cloudflare/workers-types');
  });

  it('type-checks the Worker with the existing TypeScript source and globals', () => {
    const tsconfig = readJson('tsconfig.json');
    const compilerOptions = tsconfig.compilerOptions as Record<string, unknown>;

    expect(compilerOptions.types).toEqual(['vitest/globals']);
    expect(tsconfig.include).toEqual([
      '.astro/types.d.ts',
      'src/**/*.ts',
      'src/**/*.astro',
      'scripts/**/*.ts',
    ]);
  });

  it('does not keep runtime release state in the static catalog module', () => {
    const catalogSource = readFileSync('src/data/catalog.ts', 'utf8');

    expect(catalogSource).not.toMatch(/RELEASE_ID|releaseId/);
  });
});
