import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { auditBuild } from './audit-build';

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })));

describe('build audit', () => {
  it('rejects sensitive deployment artifacts', () => {
    const root = mkdtempSync(join(tmpdir(), 'audit-'));
    roots.push(root);
    mkdirSync(join(root, 'nested'));
    writeFileSync(join(root, 'index.html'), '<html></html>');
    writeFileSync(join(root, '404.html'), '<html></html>');
    expect(() => auditBuild(root)).not.toThrow();
    writeFileSync(join(root, 'nested', 'prestige-chromas.json'), '[]');
    expect(() => auditBuild(root)).toThrow(/sensitive/i);
  });
});
