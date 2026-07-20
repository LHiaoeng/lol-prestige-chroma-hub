# Chroma History Blog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a bilingual, illustrated first-party chroma explainer with portable local media.

**Architecture:** Keep the article build-time static. Extend the typed blog metadata and list renderer, add one Astro article route, store only used images under a focused public directory, and register the route in the existing Sitemap contracts.

**Tech Stack:** Astro, TypeScript, Vitest source contracts, static public assets

---

### Task 1: Preserve article media

**Files:**
- Create: `public/images/blog/chroma-history/*`

- [ ] Save the hero, refined-colour comparison, purchase, timeline, and representative chroma artwork used by the article.
- [ ] Confirm every downloaded file has a non-zero size and recognized image format.

### Task 2: Add metadata and list support

**Files:**
- Modify: `src/blog/articles.ts`
- Modify: `src/blog/articles.test.ts`
- Modify: `src/pages/blog/index.astro`

- [ ] Add the new article metadata with `/blog/what-are-chroma-skins/`, bilingual copy, publication date, reading time, and local cover.
- [ ] Render every `blogArticles` entry as a responsive card while keeping the newest article first.
- [ ] Extend metadata and list contracts for two valid, unique entries.

### Task 3: Build the bilingual article

**Files:**
- Create: `src/pages/blog/what-are-chroma-skins.astro`
- Modify: `scripts/blog-feature.test.ts`

- [ ] Add `BlogPosting` and `BreadcrumbList` structured data.
- [ ] Write separate natural Chinese and English versions covering definition, 2016 context, purchase changes, visual refinement, historical examples, and the historical-rule disclaimer.
- [ ] Use local figures with bilingual alt text, dimensions, captions, and placeholders.
- [ ] Reuse the established responsive article typography and prevent horizontal overflow down to 320px.

### Task 4: Register and document the route

**Files:**
- Modify: `src/seo/sitemap.ts`
- Modify: `src/seo/sitemap.test.ts`
- Modify: `README.md`
- Modify: `docs/frontend-design.md`

- [ ] Add the new canonical route to the fixed Sitemap entries and its contract.
- [ ] Document the second article, multi-card list, local media, and CDN migration boundary.
- [ ] Run `git diff --check` only; leave automated tests and builds for the user's manual verification request.
