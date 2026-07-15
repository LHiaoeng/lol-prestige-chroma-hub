import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readJson = (path: string) => JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;

describe('Cloudflare static deployment configuration', () => {
  it('serves dist as static Worker assets without runtime bindings', () => {
    const wrangler = readJson('wrangler.jsonc');

    expect(wrangler.name).toBe('lol-prestige-chroma-hub');
    expect(wrangler.compatibility_date).toBeTruthy();
    expect(wrangler.assets).toEqual({
      directory: './dist',
      not_found_handling: '404-page',
    });
    expect(wrangler).not.toHaveProperty('main');
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

  it('does not include Worker source or Worker globals in TypeScript', () => {
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
});
