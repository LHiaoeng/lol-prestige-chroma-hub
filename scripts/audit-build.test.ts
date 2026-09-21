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
    mkdirSync(join(root, 'zh-cn'));
    writeFileSync(join(root, 'zh-cn', 'index.html'), '<html></html>');
    mkdirSync(join(root, '_astro'));
    writeFileSync(join(root, '_astro', 'page.D4gH3x.js'), 'console.log("static")');
    return root;
  };

  it('allows Astro hashed assets', () => {
    const root = createBuild();
    expect(() => auditBuild(root)).not.toThrow();
  });

  it('rejects an English canonical page without its Simplified Chinese counterpart', () => {
    const root = createBuild();
    mkdirSync(join(root, 'blog'));
    writeFileSync(join(root, 'blog', 'index.html'), '<link rel="canonical" href="https://chromaart.lol/blog/">');
    expect(() => auditBuild(root)).toThrow(/Simplified Chinese counterpart/i);
  });

  it('rejects blank HTML documents', () => {
    const root = createBuild();
    mkdirSync(join(root, 'blog'));
    writeFileSync(join(root, 'blog', 'empty.html'), '');
    expect(() => auditBuild(root)).toThrow(/blank html/i);
  });

  it('rejects advertising markup on a catalog detail', () => {
    const root = createBuild();
    mkdirSync(join(root, 'chromas', 'sample'), { recursive: true });
    writeFileSync(join(root, 'chromas', 'sample', 'index.html'), '<link rel="canonical" href="https://chromaart.lol/chromas/sample/"><aside data-ad-boundary="catalog-index"></aside>');
    expect(() => auditBuild(root)).toThrow(/advertising/i);
  });

  it('rejects catalog details in the sitemap', () => {
    const root = createBuild();
    writeFileSync(join(root, 'sitemap.xml'), '<urlset><url><loc>https://chromaart.lol/chromas/sample/</loc></url></urlset>');
    expect(() => auditBuild(root)).toThrow(/sitemap/i);
  });

  it('allows advertising on the bilingual blog index and article routes', () => {
    const root = createBuild();
    mkdirSync(join(root, 'blog', 'what-is-league-of-legends'), { recursive: true });
    mkdirSync(join(root, 'zh-cn', 'blog', 'what-is-league-of-legends'), { recursive: true });
    mkdirSync(join(root, 'zh-cn', 'blog'), { recursive: true });
    const adMarkup = '<script src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script><aside data-ad-boundary="editorial-article"></aside>';
    writeFileSync(join(root, 'blog', 'index.html'), `<link rel="canonical" href="https://chromaart.lol/blog/">${adMarkup}`);
    writeFileSync(join(root, 'zh-cn', 'blog', 'index.html'), `<link rel="canonical" href="https://chromaart.lol/zh-cn/blog/">${adMarkup}`);
    writeFileSync(join(root, 'blog', 'what-is-league-of-legends', 'index.html'), `<link rel="canonical" href="https://chromaart.lol/blog/what-is-league-of-legends/">${adMarkup}`);
    writeFileSync(join(root, 'zh-cn', 'blog', 'what-is-league-of-legends', 'index.html'), `<link rel="canonical" href="https://chromaart.lol/zh-cn/blog/what-is-league-of-legends/">${adMarkup}`);
    expect(() => auditBuild(root)).not.toThrow();
  });

  it('rejects retired runtime entity pages even when their IA fragments are valid', () => {
    const root = createBuild();
    mkdirSync(join(root, 'skins', 'parent'), { recursive: true });
    writeFileSync(join(root, 'skins', 'parent', 'index.html'), '<section id="stage-3"></section>');
    writeFileSync(join(root, 'index.html'), '<a href="/skins/parent/#stage-3">Stage 3</a>');
    expect(() => auditBuild(root)).toThrow(/runtime entity/i);
  });

  it('allows fixed runtime detail shells', () => {
    const root = createBuild();
    mkdirSync(join(root, 'champions', 'detail'), { recursive: true });
    mkdirSync(join(root, 'zh-cn', 'champions', 'detail'), { recursive: true });
    writeFileSync(
      join(root, 'champions', 'detail', 'index.html'),
      '<link rel="canonical" href="https://chromaart.lol/champions/detail/">',
    );
    writeFileSync(
      join(root, 'zh-cn', 'champions', 'detail', 'index.html'),
      '<link rel="canonical" href="https://chromaart.lol/zh-cn/champions/detail/">',
    );

    expect(() => auditBuild(root)).not.toThrow();
  });

  it('rejects the retired skin entry shells', () => {
    const root = createBuild();
    mkdirSync(join(root, 'skins'));
    writeFileSync(join(root, 'skins', 'index.html'), '<html></html>');

    expect(() => auditBuild(root)).toThrow(/skin entry/i);
  });

  it.each([
    'nested/prestige-chromas.json',
    '_astro/page.D4gH3x.js.map',
    '_astro/page.D4gH3x.js.MAP',
    'migrations/0001_create_chromas.sql',
    'database/chromas.sqlite',
    'database/chromas.sqlite-wal',
    'database/chromas.SQLITE-SHM',
    'database/chromas.db-journal',
    'database/export.sql.gz',
    'database/export.SQL.BR',
    'database/export.sql.zip',
    'runtime/skin.jpg',
    'communitydragon/skins.json',
  ])('rejects sensitive deployment artifact %s', (artifact) => {
    const root = createBuild();
    const path = join(root, artifact);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, 'sensitive');
    expect(() => auditBuild(root)).toThrow(/sensitive/i);
  });

  it('rejects a copied CommunityDragon response', () => {
    const root = createBuild();
    mkdirSync(join(root, 'runtime'), { recursive: true });
    writeFileSync(join(root, 'runtime', 'skins.json'), '[]');

    expect(() => auditBuild(root)).toThrow(/deployment artifacts/i);
  });

  it('rejects nested PBE entity pages', () => {
    const root = createBuild();
    mkdirSync(join(root, 'pbe-additions', 'champions', '103'), { recursive: true });
    writeFileSync(join(root, 'pbe-additions', 'champions', '103', 'index.html'), '<html></html>');

    expect(() => auditBuild(root)).toThrow(/PBE entity/i);
  });
});
