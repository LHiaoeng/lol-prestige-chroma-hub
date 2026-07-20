# LoL Chroma Art Brand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand the public site as `LoL Chroma Art` and align SEO, visible copy, terminology, tests, and authoritative documentation with the approved China-exclusive chroma splash-art positioning.

**Architecture:** Keep site identity in `src/seo/site.ts` and record-derived metadata in `src/seo/chroma-seo.ts`. Pages consume those values while retaining the existing static, bilingual, data-driven architecture.

**Tech Stack:** Astro 7, TypeScript strict, Vitest, static JSON-LD, pnpm.

---

### Task 1: Lock the new SEO contract with failing tests

**Files:**
- Modify: `src/seo/chroma-seo.test.ts`
- Modify: `src/seo/sitemap.test.ts`
- Modify: `scripts/site-build.test.ts`
- Modify: `src/catalog/browser-app.test.ts`

- [ ] **Step 1: Update exact site-entity expectations**

```ts
expect(SITE).toMatchObject({ name: 'LoL Chroma Art', origin: 'https://chromaart.lol' });
expect(HOME_SEO.title).toBe('LoL China-Exclusive Chroma Splash Arts | LoL Chroma Art');
expect(HOME_SEO.description).toBe(
  'Explore an independent archive of unique splash arts created for selected chromas in the Chinese version of League of Legends, operated by Tencent.',
);
expect(HOME_SEO.jsonLd).toEqual(expect.arrayContaining([
  expect.objectContaining({
    '@type': 'WebSite',
    name: 'LoL Chroma Art',
    alternateName: 'China-Exclusive Chroma Splash Art Archive',
  }),
]));
```

Update detail, sitemap, dynamic-card, and generated-page expectations so generic artwork uses `China-Exclusive Chroma Splash Art`. Retain `Prestige Chroma` only for category assertions.

- [ ] **Step 2: Verify the updated tests fail against the old implementation**

Run:

```bash
pnpm test -- src/seo/chroma-seo.test.ts src/seo/sitemap.test.ts src/catalog/browser-app.test.ts scripts/site-build.test.ts
```

Expected: FAIL with old `CHROMA ART`, `China Exclusive Prestige Chroma`, or old description values.

### Task 2: Implement centralized brand and SEO values

**Files:**
- Modify: `src/seo/site.ts`
- Modify: `src/seo/chroma-seo.ts`

- [ ] **Step 1: Replace the site constants and homepage entity**

```ts
export const SITE = {
  name: 'LoL Chroma Art',
  origin: 'https://chromaart.lol',
  defaultImage: 'https://chromaart.lol/placeholder.svg',
  tagline: 'China-Exclusive Chroma Splash Art Archive',
} as const;

export const HOME_SEO = {
  title: `LoL China-Exclusive Chroma Splash Arts | ${SITE.name}`,
  description: 'Explore an independent archive of unique splash arts created for selected chromas in the Chinese version of League of Legends, operated by Tencent.',
  canonical: `${SITE.origin}/`,
  jsonLd: [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${SITE.origin}/#website`,
      name: SITE.name,
      alternateName: SITE.tagline,
      url: `${SITE.origin}/`,
    },
  ],
} as const;
```

Preserve the existing `CollectionPage`, but describe unique splash arts for selected chromas rather than all chromas.

- [ ] **Step 2: Generalize record-derived artwork wording**

```ts
const splashArtLabel = (name: string) =>
  `${name} China-Exclusive Chroma Splash Art`;

const description = `View the unique splash art for ${descriptionSubject(chroma)}, a chroma of ${chroma.skinNameEn} featured in the Chinese version of League of Legends, with patch ${chroma.gameVer} details.`;
```

Preserve existing title-length behavior. Category labels remain sourced from `src/i18n.ts`.

- [ ] **Step 3: Run focused SEO tests**

Run `pnpm test -- src/seo/chroma-seo.test.ts src/seo/sitemap.test.ts`.

Expected: PASS.

### Task 3: Update visible branding and explanatory copy

**Files:**
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `src/pages/index.astro`
- Modify: `src/pages/about.astro`
- Modify: `src/pages/chromas/[slug].astro`
- Modify: `src/pages/404.astro`
- Modify: `src/pages/privacy.astro`
- Modify: `src/pages/blog/index.astro`
- Modify: `src/pages/blog/what-are-chroma-skins.astro`

- [ ] **Step 1: Update the Header and footer notice**

Render `LoL Chroma Art` in visible and accessible brand labels. Use this English notice with a faithful Chinese equivalent:

```text
LoL Chroma Art is an independent fan archive and is not affiliated with or endorsed by Riot Games or Tencent. League of Legends assets are used under Riot Games' Legal Jibber Jabber policy.
```

Keep the existing Riot policy link and layout behavior.

- [ ] **Step 2: Update homepage positioning without changing layout**

```text
H1: League of Legends China-Exclusive Chroma Splash Arts
Tagline: China-Exclusive Chroma Splash Art Archive
Body: Explore an independent archive of unique splash arts created for selected chromas in the Chinese version of League of Legends, operated by Tencent.
```

Chinese copy must say these are independent artworks for selected chromas in the Tencent-operated Chinese version.

- [ ] **Step 3: Correct the About definition**

```text
A chroma splash art is a unique splash artwork created for a specific chroma. Most chromas reuse their base skin's splash art and do not have one of their own.
```

Explain `Prestige Chroma` as the site's translation for the 臻彩 category, distinguish it from `Prestige Skin`, and identify Tencent as operator of the Chinese version.

- [ ] **Step 4: Replace remaining public brand strings**

Update privacy, 404, blog kickers, titles, article metadata, accessible detail headings, and related-section wording. Keep `Prestige Chroma` category translations in `src/i18n.ts` unchanged.

- [ ] **Step 5: Run page contracts**

Run:

```bash
pnpm test -- src/catalog/browser-app.test.ts scripts/site-build.test.ts scripts/blog-feature.test.ts scripts/responsive-layout.test.ts
```

Expected: PASS.

### Task 4: Update current documentation

**Files:**
- Modify: `README.md`
- Modify: `docs/frontend-design.md`
- Modify: `docs/design-system.md`

- [ ] **Step 1: Update README identity and scope**

Use `# LoL Chroma Art`. Describe an English-first bilingual archive of China-exclusive chroma splash arts, state that most chromas reuse their base skin art, and reserve `Prestige Chroma` for the 臻彩 category.

- [ ] **Step 2: Update the authoritative frontend contract**

```text
Brand: LoL Chroma Art
Positioning: China-Exclusive Chroma Splash Art Archive
Content type: Chroma Splash Art
Category translation: 臻彩 = Prestige Chroma
```

Document Tencent as operator, the independent archive notice, and the rule that `Prestige Chroma` cannot describe the entire catalog.

- [ ] **Step 3: Rename the visual-system heading**

Change it to `# LoL Chroma Art 视觉规范`. Keep `Chroma Gold` and all visual tokens unchanged.

- [ ] **Step 4: Check documentation formatting**

Run `git diff --check -- README.md docs/frontend-design.md docs/design-system.md`.

Expected: no output and exit code 0.

### Task 5: Verify the complete change

**Files:**
- Review: all files changed in Tasks 1–4.

- [ ] **Step 1: Scan obsolete public wording**

Run:

```bash
rg -n "CHROMA ART|Chroma Art|China Exclusive Prestige Chroma" src scripts README.md docs/frontend-design.md docs/design-system.md
```

Expected: no obsolete public-brand occurrences. Remaining `Prestige Chroma` occurrences must be category translations, fixtures, or explicit distinctions.

- [ ] **Step 2: Run the release gate**

Run `pnpm release:build`.

Expected: tests, typecheck, data validation, Astro build, and build audit all pass.

- [ ] **Step 3: Review final changes**

Run `git diff --stat`, `git diff --check`, and `git status --short` separately.

Expected: only task-related files plus pre-existing user changes; no generated files, credentials, remote images, or unrelated changes.
