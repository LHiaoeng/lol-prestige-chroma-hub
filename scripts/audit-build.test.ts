import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { auditBuild } from './audit-build';

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })));

describe('build audit', () => {
  const createBuild = () => {
    const root = mkdtempSync(join(tmpdir(), 'audit-'));
    roots.push(root);
    writeFileSync(join(root, 'index.html'), '<html></html>');
    writeFileSync(join(root, '404.html'), '<html></html>');
    mkdirSync(join(root, '_astro'));
    writeFileSync(join(root, '_astro', 'page.D4gH3x.js'), 'console.log("static")');
    return root;
  };

  it('allows Astro hashed assets', () => {
    const root = createBuild();
    expect(() => auditBuild(root)).not.toThrow();
  });

  it.each([
    'nested/prestige-chromas.json',
    '_astro/page.D4gH3x.js.map',
    '_astro/page.D4gH3x.js.MAP',
    'migrations/0001_create_chromas.sql',
    'database/chromas.sqlite',
  ])('rejects sensitive deployment artifact %s', (artifact) => {
    const root = createBuild();
    const path = join(root, artifact);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, 'sensitive');
    expect(() => auditBuild(root)).toThrow(/sensitive/i);
  });
});
