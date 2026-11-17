import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { AD_SCRIPT_URLS } from '../src/domain/ad-policy';
import { auditBuild, GOOGLE_TAG_INIT, GOOGLE_TAG_SCRIPT } from './audit-build';

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })));

const googleTagHead = `<head><script async src="${GOOGLE_TAG_SCRIPT}"></script><script>window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}${GOOGLE_TAG_INIT}</script></head>`;
const page = (body = '') => `<html>${googleTagHead}<body>${body}</body></html>`;
const adSlot = (provider: 'adsterra' | 'adsense' = 'adsterra', placement = 'page', attributes = '') =>
  `<aside data-ad-boundary="${placement}" data-ad-provider="${provider}" data-ad-script="${AD_SCRIPT_URLS[provider]}" data-ad-init="${provider === 'adsterra' ? 'iframe-srcdoc' : 'adsbygoogle'}"${attributes}></aside>`;

describe('build audit', () => {
  const createBuild = (provider: 'adsterra' | 'adsense' | 'none' = 'adsterra') => {
    const root = mkdtempSync(join(tmpdir(), 'audit-'));
    roots.push(root);
    const ad = provider === 'none' ? '' : adSlot(provider, 'page', provider === 'adsense' ? ' data-ad-slot="12345"' : '');
    writeFileSync(join(root, 'index.html'), page(`<link rel="canonical" href="https://chromaart.lol/">${ad}`));
    writeFileSync(join(root, '404.html'), page());
    mkdirSync(join(root, 'zh-cn'));
    writeFileSync(join(root, 'zh-cn', 'index.html'), page(`<link rel="canonical" href="https://chromaart.lol/zh-cn/">${ad}`));
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
    writeFileSync(join(root, 'blog', 'index.html'), page(`<link rel="canonical" href="https://chromaart.lol/blog/">${adSlot()}`));
    expect(() => auditBuild(root)).toThrow(/Simplified Chinese counterpart/i);
  });

  it('rejects blank HTML documents', () => {
    const root = createBuild();
    mkdirSync(join(root, 'blog'));
    writeFileSync(join(root, 'blog', 'empty.html'), '');
    expect(() => auditBuild(root)).toThrow(/blank html/i);
  });

  it('allows advertising on a catalog detail', () => {
    const root = createBuild();
    mkdirSync(join(root, 'chromas', 'sample'), { recursive: true });
    writeFileSync(join(root, 'chromas', 'sample', 'index.html'), page(`<link rel="canonical" href="https://chromaart.lol/chromas/sample/">${adSlot()}`));
    mkdirSync(join(root, 'zh-cn', 'chromas', 'sample'), { recursive: true });
    writeFileSync(join(root, 'zh-cn', 'chromas', 'sample', 'index.html'), page(`<link rel="canonical" href="https://chromaart.lol/zh-cn/chromas/sample/">${adSlot()}`));
    expect(() => auditBuild(root)).not.toThrow();
  });

  it('defaults new pages to ads and allows only explicit existing exclusions', () => {
    const root = createBuild();
    mkdirSync(join(root, 'new-page'), { recursive: true });
    writeFileSync(join(root, 'new-page', 'index.html'), page(`<link rel="canonical" href="https://chromaart.lol/new-page/">${adSlot()}`));
    mkdirSync(join(root, 'zh-cn', 'new-page'), { recursive: true });
    writeFileSync(join(root, 'zh-cn', 'new-page', 'index.html'), page(`<link rel="canonical" href="https://chromaart.lol/zh-cn/new-page/">${adSlot()}`));
    mkdirSync(join(root, 'privacy'), { recursive: true });
    writeFileSync(join(root, 'privacy', 'index.html'), page('<link rel="canonical" href="https://chromaart.lol/privacy/">'));
    mkdirSync(join(root, 'zh-cn', 'privacy'), { recursive: true });
    writeFileSync(join(root, 'zh-cn', 'privacy', 'index.html'), page('<link rel="canonical" href="https://chromaart.lol/zh-cn/privacy/">'));
    expect(() => auditBuild(root)).not.toThrow();
  });

  it('audits the mutually exclusive provider selections and global off switch', () => {
    expect(() => auditBuild(createBuild('adsense'), 'adsense')).not.toThrow();
    expect(() => auditBuild(createBuild('none'), 'none')).not.toThrow();
  });

  it('rejects an ad platform request when advertising is disabled', () => {
    const root = createBuild('none');
    writeFileSync(join(root, 'index.html'), page(`<link rel="canonical" href="https://chromaart.lol/"><script src="${AD_SCRIPT_URLS.adsterra}"></script>`));
    expect(() => auditBuild(root, 'none')).toThrow(/source is out of scope/i);
  });

  it('rejects advertising on the 404 page', () => {
    const root = createBuild();
    writeFileSync(join(root, '404.html'), page(adSlot()));
    expect(() => auditBuild(root)).toThrow(/404 page/i);
  });

  it('rejects a provider slot that points to the other platform source', () => {
    const root = createBuild();
    const wrongSource = adSlot().replace(AD_SCRIPT_URLS.adsterra, AD_SCRIPT_URLS.adsense);
    writeFileSync(join(root, 'index.html'), page(`<link rel="canonical" href="https://chromaart.lol/">${wrongSource}`));
    expect(() => auditBuild(root)).toThrow(/source or initializer/i);
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
    const adMarkup = adSlot('adsterra', 'editorial-article');
    writeFileSync(join(root, 'blog', 'index.html'), page(`<link rel="canonical" href="https://chromaart.lol/blog/">${adMarkup}`));
    writeFileSync(join(root, 'zh-cn', 'blog', 'index.html'), page(`<link rel="canonical" href="https://chromaart.lol/zh-cn/blog/">${adMarkup}`));
    writeFileSync(join(root, 'blog', 'what-is-league-of-legends', 'index.html'), page(`<link rel="canonical" href="https://chromaart.lol/blog/what-is-league-of-legends/">${adMarkup}`));
    writeFileSync(join(root, 'zh-cn', 'blog', 'what-is-league-of-legends', 'index.html'), page(`<link rel="canonical" href="https://chromaart.lol/zh-cn/blog/what-is-league-of-legends/">${adMarkup}`));
    expect(() => auditBuild(root)).not.toThrow();
  });

  it('rejects retired runtime entity pages even when their IA fragments are valid', () => {
    const root = createBuild();
    mkdirSync(join(root, 'skins', 'parent'), { recursive: true });
    writeFileSync(join(root, 'skins', 'parent', 'index.html'), page('<section id="stage-3"></section>'));
    writeFileSync(join(root, 'index.html'), page(`<link rel="canonical" href="https://chromaart.lol/">${adSlot()}<a href="/skins/parent/#stage-3">Stage 3</a>`));
    expect(() => auditBuild(root)).toThrow(/runtime entity/i);
  });

  it('allows fixed runtime detail shells', () => {
    const root = createBuild();
    mkdirSync(join(root, 'champions', 'detail'), { recursive: true });
    mkdirSync(join(root, 'zh-cn', 'champions', 'detail'), { recursive: true });
    writeFileSync(
      join(root, 'champions', 'detail', 'index.html'),
      page(`<link rel="canonical" href="https://chromaart.lol/champions/detail/">${adSlot('adsterra', 'page', ' data-ad-deferred=""')}`),
    );
    writeFileSync(
      join(root, 'zh-cn', 'champions', 'detail', 'index.html'),
      page(`<link rel="canonical" href="https://chromaart.lol/zh-cn/champions/detail/">${adSlot('adsterra', 'page', ' data-ad-deferred=""')}`),
    );

    expect(() => auditBuild(root)).not.toThrow();
  });

  it('allows bilingual skin catalog shells', () => {
    const root = createBuild();
    mkdirSync(join(root, 'skins'));
    mkdirSync(join(root, 'zh-cn', 'skins'));
    writeFileSync(join(root, 'skins', 'index.html'), page('<link rel="canonical" href="https://chromaart.lol/skins/">'));
    writeFileSync(join(root, 'zh-cn', 'skins', 'index.html'), page('<link rel="canonical" href="https://chromaart.lol/zh-cn/skins/">'));

    expect(() => auditBuild(root)).not.toThrow();
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
    writeFileSync(join(root, 'pbe-additions', 'champions', '103', 'index.html'), page());

    expect(() => auditBuild(root)).toThrow(/PBE entity/i);
  });

  it('rejects a page without the Google tag', () => {
    const root = createBuild();
    writeFileSync(join(root, 'index.html'), '<html><head></head><body></body></html>');

    expect(() => auditBuild(root)).toThrow(/Google tag/i);
  });

  it('rejects a duplicated Google tag', () => {
    const root = createBuild();
    writeFileSync(join(root, 'index.html'), `<html>${googleTagHead}${googleTagHead}<body></body></html>`);

    expect(() => auditBuild(root)).toThrow(/exactly once/i);
  });

  it('rejects a Google tag outside the head', () => {
    const root = createBuild();
    writeFileSync(join(root, 'index.html'), `<html><head></head><body><script async src="${GOOGLE_TAG_SCRIPT}"></script><script>${GOOGLE_TAG_INIT}</script></body></html>`);

    expect(() => auditBuild(root)).toThrow(/placed in <head>/i);
  });

  it('checks the 404 page for the Google tag too', () => {
    const root = createBuild();
    writeFileSync(join(root, '404.html'), '<html><head></head><body></body></html>');

    expect(() => auditBuild(root)).toThrow(/Google tag/i);
  });
});
