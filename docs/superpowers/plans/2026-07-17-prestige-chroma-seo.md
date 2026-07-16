# Prestige Chroma SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make CHROMA ART rank for broad `China Exclusive Prestige Chroma` searches and record-specific League of Legends splash-art searches while automatically covering every future catalog record.

**Architecture:** Add a data-driven SEO layer under `src/seo/` and make Astro pages consume it instead of composing metadata locally. Keep the current static routes and client-side catalog behavior, enrich the existing sitemap with image entries, and enforce generated output through Vitest and build tests.

**Tech Stack:** Astro 7 static output, TypeScript 6, Vitest 4, schema.org JSON-LD, XML image sitemap

---

## File map

- Create `src/seo/site.ts`: site identity and home SEO graph.
- Create `src/seo/chroma-seo.ts`: record-derived detail metadata and image alt text.
- Create `src/seo/chroma-seo.test.ts`: generator and whole-catalog invariants.
- Create `src/seo/sitemap.ts` and `src/seo/sitemap.test.ts`: escaped page/image sitemap.
- Modify `src/layouts/BaseLayout.astro`: brand and social metadata.
- Modify `src/pages/index.astro`, `src/pages/about.astro`, and `src/pages/chromas/[slug].astro`: page SEO and visible terminology.
- Modify `src/components/ChromaCard.astro` and `src/catalog/browser-app.ts`: consistent image semantics.
- Modify `src/pages/sitemap.xml.ts`: delegate XML generation.
- Modify `scripts/site-build.test.ts`: verify production HTML and XML.

### Task 1: Site and record SEO generators

**Files:**
- Create: `src/seo/site.ts`
- Create: `src/seo/chroma-seo.ts`
- Create: `src/seo/chroma-seo.test.ts`

- [ ] **Step 1: Write the failing generator test**

Create `src/seo/chroma-seo.test.ts` using the real parsed catalog so the test automatically covers future records:

```ts
import { describe, expect, it } from 'vitest';
import { catalog } from '../data/catalog';
import { chromaImageAlt, createChromaSeo } from './chroma-seo';
import { HOME_SEO, SITE } from './site';

describe('site SEO', () => {
  it('defines the agreed home intent', () => {
    expect(SITE).toMatchObject({ name: 'CHROMA ART', origin: 'https://chromaart.lol' });
    expect(HOME_SEO.title).toBe('LoL China Exclusive Prestige Chroma Splash Arts | CHROMA ART');
    expect(HOME_SEO.description).toContain('League of Legends');
    expect(HOME_SEO.description).toContain('China Exclusive Prestige Chromas');
    expect(HOME_SEO.jsonLd).toEqual(expect.arrayContaining([
      expect.objectContaining({ '@type': 'WebSite', name: 'CHROMA ART' }),
      expect.objectContaining({ '@type': 'CollectionPage' }),
    ]));
  });
});

describe('chroma SEO', () => {
  it('derives record metadata instead of using skin lore', () => {
    const chroma = catalog[0];
    const seo = createChromaSeo(chroma);
    expect(seo.canonical).toBe(`https://chromaart.lol/chromas/${chroma.slug}/`);
    expect(seo.title).toContain(chroma.nameEn);
    expect(seo.title).toContain('China Exclusive Prestige Chroma');
    expect(seo.title).toContain('CHROMA ART');
    expect(seo.description).toContain('League of Legends');
    expect(seo.description).toContain(`patch ${chroma.gameVer}`);
    expect(seo.description).not.toBe(chroma.descriptionEn);
    expect(seo.imageAlt).toBe(`${chroma.nameEn} China Exclusive Prestige Chroma splash art`);
  });

  it('keeps the growing catalog unique and concise', () => {
    const values = catalog.map(createChromaSeo);
    expect(new Set(values.map(({ canonical }) => canonical)).size).toBe(catalog.length);
    expect(new Set(values.map(({ title }) => title)).size).toBe(catalog.length);
    expect(values.every(({ title }) => title.length <= 110)).toBe(true);
    expect(values.every(({ description }) => description.length <= 180)).toBe(true);
    expect(values.every(({ description }) => description.includes('China Exclusive Prestige Chroma'))).toBe(true);
  });

  it('formats reusable image text', () => {
    expect(chromaImageAlt('Arcane Commander Caitlyn (Stellar)'))
      .toBe('Arcane Commander Caitlyn (Stellar) China Exclusive Prestige Chroma splash art');
  });
});
```

- [ ] **Step 2: Verify the test fails**

Run `pnpm vitest run src/seo/chroma-seo.test.ts`.

Expected: FAIL because both SEO modules are missing.

- [ ] **Step 3: Implement site constants**

Create `src/seo/site.ts`:

```ts
export const SITE = {
  name: 'CHROMA ART',
  origin: 'https://chromaart.lol',
  defaultImage: 'https://chromaart.lol/placeholder.svg',
} as const;

export const HOME_SEO = {
  title: `LoL China Exclusive Prestige Chroma Splash Arts | ${SITE.name}`,
  description: 'Explore China Exclusive Prestige Chromas for League of Legends, featuring unique splash arts from Riot Games and updates for every new LoL patch.',
  canonical: `${SITE.origin}/`,
  jsonLd: [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${SITE.origin}/#website`,
      name: SITE.name,
      alternateName: 'League of Legends China Exclusive Prestige Chroma Art',
      url: `${SITE.origin}/`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      '@id': `${SITE.origin}/#collection`,
      name: 'League of Legends China Exclusive Prestige Chroma Splash Arts',
      description: 'A continuously updated archive of China Exclusive Prestige Chroma splash arts for League of Legends.',
      url: `${SITE.origin}/`,
      isPartOf: { '@id': `${SITE.origin}/#website` },
    },
  ],
} as const;
```

- [ ] **Step 4: Implement record SEO**

Create `src/seo/chroma-seo.ts`:

```ts
import type { Chroma } from '../domain/chroma';
import { imageUrl } from '../domain/chroma';
import { SITE } from './site';

export function chromaImageAlt(name: string): string {
  return `${name} China Exclusive Prestige Chroma splash art`;
}

function descriptionSubject(chroma: Chroma): string {
  return chroma.nameEn.toLowerCase().includes(chroma.skinNameEn.toLowerCase())
    ? chroma.nameEn
    : `${chroma.nameEn} for ${chroma.skinNameEn}`;
}

export function createChromaSeo(chroma: Chroma) {
  const canonical = `${SITE.origin}/chromas/${chroma.slug}/`;
  const image = imageUrl(chroma.images.large);
  const description = `Explore ${descriptionSubject(chroma)}, a China Exclusive Prestige Chroma in League of Legends, with unique splash art and patch ${chroma.gameVer} details.`;
  return {
    title: `${chroma.nameEn} China Exclusive Prestige Chroma Splash Art | ${SITE.name}`,
    description,
    canonical,
    image,
    imageAlt: chromaImageAlt(chroma.nameEn),
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'ImageObject',
        name: chroma.nameEn,
        url: canonical,
        contentUrl: image,
        representativeOfPage: true,
        description,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE.origin}/` },
          { '@type': 'ListItem', position: 2, name: chroma.skinNameEn },
          { '@type': 'ListItem', position: 3, name: chroma.nameEn, item: canonical },
        ],
      },
    ],
  };
}
```

- [ ] **Step 5: Verify and commit**

Run `pnpm vitest run src/seo/chroma-seo.test.ts`; expect PASS.

```powershell
git add src/seo/site.ts src/seo/chroma-seo.ts src/seo/chroma-seo.test.ts
git commit -m "feat: add data-driven prestige chroma seo"
```

### Task 2: Layout and home page

**Files:**
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `src/pages/index.astro`
- Modify: `scripts/site-build.test.ts`

- [ ] **Step 1: Add failing production-output assertions**

Add to the first build test:

```ts
expect(home).toContain('<title>LoL China Exclusive Prestige Chroma Splash Arts | CHROMA ART</title>');
expect(home).toContain('<meta property="og:site_name" content="CHROMA ART">');
expect(home).toContain('<meta name="twitter:title" content="LoL China Exclusive Prestige Chroma Splash Arts | CHROMA ART">');
expect(home).toContain('League of Legends China Exclusive Prestige Chroma Splash Arts');
expect(home).toContain('not traditional Prestige Skins');
expect(home).toContain('"@type":"WebSite"');
expect(home).toContain('"@type":"CollectionPage"');
```

- [ ] **Step 2: Verify failure**

Run `pnpm vitest run scripts/site-build.test.ts`.

Expected: FAIL on title, brand casing, Twitter metadata, definition, and WebSite assertions.

- [ ] **Step 3: Update BaseLayout**

Import `SITE`, use `SITE.defaultImage`, render `og:site_name={SITE.name}`, and add:

```astro
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={description} />
<meta name="twitter:image" content={image} />
```

Change English brand ARIA and footer subject to `CHROMA ART`; retain the Riot Games non-endorsement.

- [ ] **Step 4: Update the home page**

Import `HOME_SEO`, delete local metadata composition, and pass its fields to `BaseLayout`. Replace the English hero with:

```astro
<h1><span data-language-content="en">League of Legends<br /><em>China Exclusive Prestige Chroma Splash Arts</em></span><span data-language-content="zh">英雄联盟中国独家<br /><em>臻彩皮肤原画</em></span></h1>
<p data-en="Explore China Exclusive Prestige Chromas for League of Legends, featuring unique splash arts from Riot Games and updates for every new LoL patch. These are chromas of existing skins, not traditional Prestige Skins." data-zh="探索《英雄联盟》中国服务器独家臻彩皮肤原画。臻彩是拥有独立原画的皮肤炫彩，并非传统至臻皮肤。">Explore China Exclusive Prestige Chromas for League of Legends, featuring unique splash arts from Riot Games and updates for every new LoL patch. These are chromas of existing skins, not traditional Prestige Skins.</p>
```

Change the English catalog H2 to `China Exclusive Prestige Chromas` and update the empty-state sentence with the same term.

- [ ] **Step 5: Verify and commit**

Run `pnpm vitest run scripts/site-build.test.ts src/seo/chroma-seo.test.ts`; expect PASS.

```powershell
git add src/layouts/BaseLayout.astro src/pages/index.astro scripts/site-build.test.ts
git commit -m "feat: optimize home page seo metadata"
```

### Task 3: Detail pages and card images

**Files:**
- Modify: `src/pages/chromas/[slug].astro`
- Modify: `src/components/ChromaCard.astro`
- Modify: `src/catalog/browser-app.ts`
- Modify: `src/catalog/browser-app.test.ts`
- Modify: `scripts/site-build.test.ts`

- [ ] **Step 1: Add failing output tests**

Import `catalog` in `scripts/site-build.test.ts`, read `dist/chromas/{catalog[0].slug}/index.html`, and assert:

```ts
expect(detail).toContain(`${sample.nameEn} China Exclusive Prestige Chroma Splash Art | CHROMA ART`);
expect(detail).toContain('China Exclusive Prestige Chroma in League of Legends');
expect(detail).toContain(`${sample.nameEn} China Exclusive Prestige Chroma splash art`);
expect(detail).toContain('CHINA EXCLUSIVE PRESTIGE CHROMA');
expect(detail).toContain('Related China Exclusive Prestige Chromas');
expect(detail).toContain('"representativeOfPage":true');
```

In the browser rendering test, assert the rendered card image alt equals `Prestige Rose Gwen China Exclusive Prestige Chroma splash art`.

- [ ] **Step 2: Verify failure**

Run `pnpm vitest run src/catalog/browser-app.test.ts scripts/site-build.test.ts`.

Expected: FAIL because current pages/cards use the old text.

- [ ] **Step 3: Connect detail SEO**

Import and call `createChromaSeo(chroma)`; delete local canonical, image, description, and JSON-LD composition. Pass `seo.title`, `seo.description`, `seo.canonical`, `seo.image`, and `seo.jsonLd` to `BaseLayout`.

Use `seo.imageAlt` in `ImageViewer` and update:

```astro
<h1 class="sr-only detail-accessible-title" data-en={`${chroma.nameEn} China Exclusive Prestige Chroma Splash Art`} data-zh={`${chroma.nameZh} 臻彩皮肤原画`}>{chroma.nameEn} China Exclusive Prestige Chroma Splash Art</h1>
<p class="eyebrow">CHINA EXCLUSIVE PRESTIGE CHROMA</p>
<h2 data-en="Related China Exclusive Prestige Chromas" data-zh="相关臻彩">Related China Exclusive Prestige Chromas</h2>
```

- [ ] **Step 4: Update static and browser card alt text**

Import `chromaImageAlt` in both files. In `ChromaCard.astro` use it for `alt` and `data-alt-en`. In `browser-app.ts` use:

```ts
image.alt = localized(language, {
  en: chromaImageAlt(item.nameEn),
  zh: `${heroName} ${itemName} 臻彩皮肤`,
});
```

- [ ] **Step 5: Verify and commit**

Run `pnpm vitest run src/seo/chroma-seo.test.ts src/catalog/browser-app.test.ts scripts/site-build.test.ts`; expect PASS.

```powershell
git add -- 'src/pages/chromas/[slug].astro' src/components/ChromaCard.astro src/catalog/browser-app.ts src/catalog/browser-app.test.ts scripts/site-build.test.ts
git commit -m "feat: add record-specific prestige chroma seo"
```

### Task 4: Factual About page

**Files:**
- Modify: `src/pages/about.astro`
- Modify: `scripts/site-build.test.ts`

- [ ] **Step 1: Add failing About assertions**

```ts
const about = readFileSync(join(dist, 'about', 'index.html'), 'utf8');
expect(about).toContain('<title>What Are LoL China Exclusive Prestige Chromas? | CHROMA ART</title>');
expect(about).toContain('not traditional Prestige Skins');
expect(about).toContain('Availability varies by event and patch');
expect(about).not.toContain('will likely be priced higher');
expect(about).not.toContain('Players should prepare');
```

- [ ] **Step 2: Verify failure**

Run `pnpm vitest run scripts/site-build.test.ts`; expect FAIL.

- [ ] **Step 3: Replace metadata and speculative copy**

Use:

```ts
const title = 'What Are LoL China Exclusive Prestige Chromas? | CHROMA ART';
const description = 'Learn what China Exclusive Prestige Chromas are in League of Legends, why they have unique splash arts, and how CHROMA ART tracks new releases.';
```

Set the English H1 to `What Are China Exclusive Prestige Chromas in League of Legends?`. End the definition with `They are chromas of existing skins, not traditional Prestige Skins.`

Rename `Price` to `Availability and Release Tracking` and use:

```text
Availability varies by event and patch on the Chinese League of Legends servers. CHROMA ART records the patch associated with each catalog entry and adds new Prestige Chromas when verified source data becomes available. For current purchase requirements, players should consult the active Chinese server event or store information.
```

Replace the final English paragraph with:

```text
China Exclusive Prestige Chromas are associated with Chinese League of Legends services and regional promotions. They are not generally listed as standard chromas in the global client. Exact acquisition methods can change between events, so this archive focuses on identifying the chroma, its base skin, patch, category, and unique splash art.
```

Remove equivalent unsupported predictions from the Chinese section.

- [ ] **Step 4: Verify and commit**

Run `pnpm vitest run scripts/site-build.test.ts`; expect PASS.

```powershell
git add src/pages/about.astro scripts/site-build.test.ts
git commit -m "content: clarify china exclusive prestige chromas"
```

### Task 5: Image sitemap

**Files:**
- Create: `src/seo/sitemap.ts`
- Create: `src/seo/sitemap.test.ts`
- Modify: `src/pages/sitemap.xml.ts`
- Modify: `scripts/site-build.test.ts`

- [ ] **Step 1: Write failing sitemap tests**

Create `src/seo/sitemap.test.ts` with an exact fixture derived from a validated catalog record:

```ts
import { describe, expect, it } from 'vitest';
import { catalog } from '../data/catalog';
import { renderSitemap } from './sitemap';

describe('SEO sitemap', () => {
  it('renders escaped canonical page and image entries', () => {
    const chroma = {
      ...catalog[0],
      slug: 'ahri-cat-eye-1',
      nameEn: 'Ahri Catseye & Pearl',
      images: { ...catalog[0].images, large: 'assets/chromas/ahri/site3.jpg' },
    };
const xml = renderSitemap([chroma]);
expect(xml).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');
expect(xml).toContain('<loc>https://chromaart.lol/chromas/ahri-cat-eye-1/</loc>');
expect(xml).toContain('<image:loc>https://img.chromaart.lol/chromas/ahri/site3.jpg</image:loc>');
expect(xml).toContain('<image:title>Ahri Catseye &amp; Pearl China Exclusive Prestige Chroma splash art</image:title>');
expect(xml).toContain('<loc>https://chromaart.lol/about/</loc>');
expect(xml).not.toContain('<loc>https://chromaart.lol/chromas/1/</loc>');
  });
});
```

- [ ] **Step 2: Verify failure**

Run `pnpm vitest run src/seo/sitemap.test.ts`; expect FAIL because the renderer is missing.

- [ ] **Step 3: Implement escaped sitemap rendering**

Create `src/seo/sitemap.ts`:

```ts
import type { Chroma } from '../domain/chroma';
import { imageUrl } from '../domain/chroma';
import { chromaImageAlt } from './chroma-seo';
import { SITE } from './site';

function escapeXml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

function page(location: string, image?: { location: string; title: string }): string {
  const imageXml = image ? `<image:image><image:loc>${escapeXml(image.location)}</image:loc><image:title>${escapeXml(image.title)}</image:title></image:image>` : '';
  return `<url><loc>${escapeXml(location)}</loc>${imageXml}</url>`;
}

export function renderSitemap(catalog: Chroma[]): string {
  const fixed = [page(`${SITE.origin}/`), page(`${SITE.origin}/about/`)];
  const details = catalog.map((chroma) => page(
    `${SITE.origin}/chromas/${chroma.slug}/`,
    { location: imageUrl(chroma.images.large), title: chromaImageAlt(chroma.nameEn) },
  ));
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${[...fixed, ...details].join('')}</urlset>`;
}
```

- [ ] **Step 4: Delegate the Astro route**

```ts
import { catalog } from '../data/catalog';
import { renderSitemap } from '../seo/sitemap';

export function GET() {
  return new Response(renderSitemap(catalog), {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  });
}
```

- [ ] **Step 5: Add production sitemap assertions**

```ts
const sitemap = readFileSync(join(dist, 'sitemap.xml'), 'utf8');
expect(sitemap.match(/<image:image>/g)).toHaveLength(catalog.length);
expect(sitemap.match(/<image:loc>/g)).toHaveLength(catalog.length);
expect(sitemap).toContain(`<loc>https://chromaart.lol/chromas/${catalog[0].slug}/</loc>`);
expect(sitemap).not.toContain(`<loc>https://chromaart.lol/chromas/${catalog[0].skinId}/</loc>`);
```

- [ ] **Step 6: Verify and commit**

Run `pnpm vitest run src/seo/sitemap.test.ts scripts/site-build.test.ts`; expect PASS.

```powershell
git add src/seo/sitemap.ts src/seo/sitemap.test.ts src/pages/sitemap.xml.ts scripts/site-build.test.ts
git commit -m "feat: add prestige chroma image sitemap"
```

### Task 6: Full release verification

**Files:**
- Modify only if a verification command exposes a real defect.

- [ ] **Step 1: Check patch hygiene**

Run `git diff --check`; expect no output.

- [ ] **Step 2: Run all tests**

Run `pnpm test`; expect all Vitest suites PASS.

- [ ] **Step 3: Run static analysis**

Run `pnpm typecheck`; expect Astro and TypeScript to report zero errors.

- [ ] **Step 4: Validate the growing catalog**

Run `pnpm data:validate`; expect all records to validate.

- [ ] **Step 5: Build and audit production output**

Run `pnpm build` and `pnpm audit:build`; expect a successful static build, one canonical/image sitemap entry per record, and no source data or source maps.

- [ ] **Step 6: Inspect scope**

Run:

```powershell
git status --short
git diff --stat
```

Expected: only planned SEO, content, sitemap, and test files are changed; generated `dist` files are not tracked.

- [ ] **Step 7: Commit a verification correction only if needed**

```powershell
git add src scripts
git commit -m "fix: satisfy prestige chroma seo verification"
```
