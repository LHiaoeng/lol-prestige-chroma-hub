# Blog Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a responsive bilingual static blog with global navigation, one featured list entry, and one illustrated League of Legends introduction article.

**Architecture:** Keep blog content build-time only. Store list metadata in a focused TypeScript module, render `/blog/` and one static Astro article, reuse `BaseLayout` language behavior and image fallback attributes, and extend the existing sitemap and build contracts.

**Tech Stack:** Astro 7, TypeScript strict, Vitest, static HTML/CSS, Schema.org JSON-LD

---

## File Structure

- Create `src/blog/articles.ts`: typed metadata for the single launch article.
- Create `src/blog/articles.test.ts`: metadata invariants and canonical URL coverage.
- Create `src/pages/blog/index.astro`: bilingual featured blog list.
- Create `src/pages/blog/what-is-league-of-legends.astro`: bilingual illustrated article.
- Create `scripts/blog-feature.test.ts`: static source contracts for navigation, bilingual content, accessibility, responsive CSS, and SEO.
- Modify `src/layouts/BaseLayout.astro`: global Header and Footer blog links.
- Modify `src/seo/sitemap.ts` and `src/seo/sitemap.test.ts`: fixed blog URLs.
- Modify `scripts/site-build.test.ts`: built route and metadata checks.
- Modify `README.md` and `docs/frontend-design.md`: blog routes and maintenance boundary.

### Task 1: Article Metadata

**Files:**
- Create: `src/blog/articles.ts`
- Create: `src/blog/articles.test.ts`

- [ ] **Step 1: Write the failing metadata test**

```ts
import { describe, expect, it } from 'vitest';
import { blogArticles } from './articles';

describe('blog article metadata', () => {
  it('defines the bilingual launch article with a canonical route', () => {
    expect(blogArticles).toHaveLength(1);
    expect(blogArticles[0]).toMatchObject({
      slug: 'what-is-league-of-legends',
      href: '/blog/what-is-league-of-legends/',
      titleEn: 'What Is League of Legends?',
      titleZh: '什么是《英雄联盟》？',
    });
    expect(blogArticles[0].publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(blogArticles[0].readingMinutes).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run `pnpm vitest run src/blog/articles.test.ts` and verify it fails because `./articles` is missing**

- [ ] **Step 3: Implement a readonly `BlogArticle` interface and one `blogArticles` entry** with slug, href, bilingual titles and summaries, ISO publication date, reading minutes, official Riot cover URL, bilingual alt text, and source URL.

- [ ] **Step 4: Run `pnpm vitest run src/blog/articles.test.ts` and verify it passes**

### Task 2: Global Navigation and Static Page Contracts

**Files:**
- Create: `scripts/blog-feature.test.ts`
- Modify: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: Write failing source-contract tests** asserting the Header and Footer both contain `href="/blog/"`, bilingual `data-en="Blog" data-zh="博客"`, and the Header link has a minimum 44px touch target in CSS.

```ts
const layout = source('src/layouts/BaseLayout.astro');
expect(layout.match(/href="\/blog\/"/g)).toHaveLength(2);
expect(layout).toContain('data-en="Blog" data-zh="博客"');
expect(layout).toContain('.header-blog-link');
```

- [ ] **Step 2: Run `pnpm vitest run scripts/blog-feature.test.ts` and verify the navigation assertions fail**

- [ ] **Step 3: Add the Header blog link before the language button and the Footer link between About and Privacy**. Style the header controls with a responsive gap, gold hover/focus state, and a 44px target without hiding the link on phones.

- [ ] **Step 4: Run the focused test and verify the navigation assertions pass**

### Task 3: Responsive Blog List

**Files:**
- Modify: `scripts/blog-feature.test.ts`
- Create: `src/pages/blog/index.astro`

- [ ] **Step 1: Add failing tests** for a `CollectionPage` JSON-LD value, bilingual page content, semantic `<article>`, article href, `<time datetime>`, reading time, cover fallback attributes, and CSS breakpoints at 1023px and 767px.

- [ ] **Step 2: Run the focused test and verify `/blog/index.astro` is missing**

- [ ] **Step 3: Implement the page** with `BaseLayout`, article metadata, a wide featured card, bilingual headings/summaries, explicit image dimensions, `loading="eager"`, `decoding="async"`, `data-fallback`, and `data-placeholder="/placeholder.svg"`.

- [ ] **Step 4: Add component-scoped responsive CSS**: wide image/text composition on desktop, compressed tablet spacing, and one-column stacked card at 767px and below; include `overflow-wrap`, visible `:focus-visible`, and reduced-motion compatibility.

- [ ] **Step 5: Run the focused test and verify all list assertions pass**

### Task 4: Illustrated Bilingual Article

**Files:**
- Modify: `scripts/blog-feature.test.ts`
- Create: `src/pages/blog/what-is-league-of-legends.astro`

- [ ] **Step 1: Add failing tests** for `BlogPosting`, `BreadcrumbList`, two complete language articles, five required topic headings per language, at least three semantic `<figure>` blocks, bilingual alt attributes, source captions, lazy loading below the hero, and placeholder fallback.

- [ ] **Step 2: Run the focused test and verify the article page is missing**

- [ ] **Step 3: Implement English and Chinese article bodies** covering game identity, Summoner's Rift objective, five roles and champions, lane/resources/team fights, and updates/lore/esports. Use one H1 per visible language article, semantic headings, prose links, figures, captions, and official source attribution.

- [ ] **Step 4: Add article JSON-LD and responsive reading styles** with a constrained line length, fluid headings, wide figures, safe mobile gutters, caption wrapping, visible focus states, and no horizontal overflow at 320px.

- [ ] **Step 5: Run the focused test and verify all article assertions pass**

### Task 5: Sitemap and Built Output

**Files:**
- Modify: `src/seo/sitemap.test.ts`
- Modify: `src/seo/sitemap.ts`
- Modify: `scripts/site-build.test.ts`

- [ ] **Step 1: Extend the sitemap test** to require both `https://chromaart.lol/blog/` and `https://chromaart.lol/blog/what-is-league-of-legends/`.

- [ ] **Step 2: Run `pnpm vitest run src/seo/sitemap.test.ts` and verify it fails**

- [ ] **Step 3: Add both canonical blog routes to the fixed sitemap entries** without changing catalog image entries.

- [ ] **Step 4: Extend the build test** to require both generated HTML files, their canonical tags, `CollectionPage`, `BlogPosting`, bilingual content markers, and Header/Footer blog links.

- [ ] **Step 5: Run `pnpm vitest run src/seo/sitemap.test.ts scripts/site-build.test.ts` and verify it passes**

### Task 6: Official Media Verification and Documentation

**Files:**
- Modify: `src/blog/articles.ts`
- Modify: `src/pages/blog/what-is-league-of-legends.astro`
- Modify: `README.md`
- Modify: `docs/frontend-design.md`

- [ ] **Step 1: Verify each selected image and attribution against an official Riot Games domain**. Prefer stable Riot CDN assets exposed by official pages; record the official page as the source link. Reject third-party or hotlink-blocked assets.

- [ ] **Step 2: Update README** to state that Astro also generates the static blog list and article, and document the two launch routes.

- [ ] **Step 3: Update `docs/frontend-design.md`** with the blog information architecture, metadata module, responsive list/article patterns, bilingual behavior, official media policy, and test coverage.

- [ ] **Step 4: Run `git diff --check` and verify there are no whitespace errors**

### Task 7: Full Verification

**Files:**
- Verify only; no planned source changes.

- [ ] **Step 1: Run `pnpm vitest run src/blog/articles.test.ts scripts/blog-feature.test.ts src/seo/sitemap.test.ts` and verify all focused tests pass**

- [ ] **Step 2: Run `pnpm typecheck` and verify Astro and TypeScript report no errors**

- [ ] **Step 3: Run `pnpm release:build` and verify tests, type checking, data validation, build, and artifact audit all pass**

- [ ] **Step 4: Inspect `git diff` and `git status --short`** to confirm only blog files and the user's pre-existing untracked plan/spec files remain; do not stage or commit without explicit authorization.
