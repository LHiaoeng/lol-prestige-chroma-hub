# JSON Static Catalog and Cloudflare Builds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the continuously updated `data/prestige-chromas.json` the only catalog data source and deploy the site as static Cloudflare Worker assets on every push to GitHub `main`.

**Architecture:** Astro validates the JSON and pre-renders the homepage, detail pages, and SEO routes. The homepage embeds a safe, list-only catalog snapshot; a tested browser module performs filtering, sorting, and pagination without `/api/chromas` or D1. Cloudflare Workers Builds runs the repository checks and deploys `dist` with an assets-only Wrangler configuration, while images remain in the externally managed `img.chromaart.lol` R2 bucket.

**Tech Stack:** Astro 7, TypeScript 6, Zod 4, Vitest 4, pnpm 10, Wrangler 4, Cloudflare Workers Static Assets and Workers Builds.

---

## File map

- Create `src/catalog/browser-catalog.ts`: pure list projection, URL query parsing, filtering, sorting, and pagination.
- Create `src/catalog/browser-catalog.test.ts`: unit coverage for browser catalog behavior.
- Create `src/catalog/browser-app.ts`: DOM adapter that renders cards and synchronizes form, pagination, and history.
- Create `src/client/image-fallback.ts`: shared image error fallback binding.
- Modify `src/pages/index.astro`: SSR fallback, safe embedded list snapshot, card template, and browser entrypoint.
- Modify `src/layouts/BaseLayout.astro`: load shared image fallback logic on all pages.
- Modify `scripts/site-build.test.ts`: assert embedded data and absence of runtime API/source JSON.
- Modify `scripts/validate-data.ts`: validate the JSON contract without requiring local image files.
- Modify `scripts/smoke.ts`: check only static routes, image URLs, and forbidden data/API routes.
- Modify `scripts/release.test.ts`: retain only deployment artifact audit tests, or rename it to `scripts/audit-build.test.ts`.
- Modify `scripts/audit-build.ts`: keep static artifact and sensitive-file checks.
- Modify `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `wrangler.jsonc`: remove D1/Worker dependencies and expose one release build command.
- Delete `worker/`, `migrations/`, `.github/workflows/deploy.yml`, `.env.example`, `public/app.js`, `scripts/prepare-release.ts`, `scripts/sync-r2.ts`, and `scripts/cloudflare-init.ts`.
- Modify `README.md`, `docs/chromaart.lol-Cloudflare部署手册.md`, and `docs/数据源与JSON结构.md`: document recurring JSON updates and Workers Builds.

### Task 1: Add the pure browser catalog engine

**Files:**
- Create: `src/catalog/browser-catalog.ts`
- Create: `src/catalog/browser-catalog.test.ts`

- [ ] **Step 1: Write failing projection and query tests**

Create fixtures with two `Chroma` records and assert that `toBrowserCatalog()` includes only list fields, `parseCatalogQuery()` applies defaults, and `queryCatalog()` filters Chinese/English names, hero, version, category, and `isNew`.

```ts
const result = queryCatalog(items, {
  q: 'rose', hero: '887', version: '26.13', category: '2', isNew: true,
  sort: 'rank_desc', page: 1, pageSize: 24,
});
expect(result.items.map((item) => item.slug)).toEqual(['gwen-rose-887034']);
expect(result.pagination).toEqual({ page: 1, pageSize: 24, total: 1, pages: 1 });
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `pnpm vitest run src/catalog/browser-catalog.test.ts`

Expected: FAIL because `browser-catalog.ts` does not exist.

- [ ] **Step 3: Implement typed projection, parsing, filtering, sorting, and pagination**

Define `BrowserCatalogItem`, `CatalogSort`, `CatalogQuery`, and `CatalogResult`. Implement `toBrowserCatalog(catalog)`, `parseCatalogQuery(URLSearchParams)`, and `queryCatalog(items, query)`. Use a numeric dotted-version comparator and clamp an out-of-range page to the last available page.

```ts
export interface BrowserCatalogItem {
  slug: string; skinId: number; instanceId: string; nameZh: string; nameEn: string;
  heroId: string; heroNameZh: string; categoryId: string; categoryName: string;
  gameVer: string; isNew: boolean; rank: number; imageMedium: string;
}

export function toBrowserCatalog(catalog: Chroma[]): BrowserCatalogItem[] {
  return catalog.map((item) => ({
    slug: item.slug, skinId: item.skinId, instanceId: item.instanceId,
    nameZh: item.nameZh, nameEn: item.nameEn, heroId: item.heroId,
    heroNameZh: item.heroNameZh, categoryId: item.categoryId,
    categoryName: item.categoryName, gameVer: item.gameVer,
    isNew: item.isNew, rank: item.rank, imageMedium: imageUrl(item.images.medium),
  }));
}
```

- [ ] **Step 4: Add sorting and page-boundary tests, then pass the suite**

Cover `rank_desc`, `rank_asc`, `skin_desc`, `skin_asc`, `version_desc`, unknown URL parameters being ignored, invalid values reverting to defaults, and page clamping.

Run: `pnpm vitest run src/catalog/browser-catalog.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the catalog engine**

```powershell
git add src/catalog/browser-catalog.ts src/catalog/browser-catalog.test.ts
git commit -m "feat: add static catalog query engine"
```

### Task 2: Replace the runtime API with embedded browser data

**Files:**
- Create: `src/catalog/browser-app.ts`
- Modify: `src/pages/index.astro`
- Modify: `scripts/site-build.test.ts`

- [ ] **Step 1: Add failing build assertions for embedded catalog data**

Extend `scripts/site-build.test.ts` to read `dist/index.html` and assert:

```ts
expect(home).toContain('id="catalog-data"');
expect(home).toContain('data-chroma-card-template');
expect(home).not.toContain('/api/chromas');
expect(home).not.toContain('prestige-chromas.json');
```

- [ ] **Step 2: Run the focused build test and verify failure**

Run: `pnpm vitest run scripts/site-build.test.ts`

Expected: FAIL because the homepage does not contain `catalog-data` or a card template.

- [ ] **Step 3: Embed a safe list-only snapshot and add a render template**

In `src/pages/index.astro`, project the catalog and escape script-breaking characters before embedding it.

```astro
---
import { toBrowserCatalog } from '../catalog/browser-catalog';
import { safeJsonLd } from '../domain/chroma';
const browserCatalog = toBrowserCatalog(catalog);
const serializedCatalog = safeJsonLd(browserCatalog);
---
<script id="catalog-data" type="application/json" set:html={serializedCatalog}></script>
<template data-chroma-card-template>
  <article class="chroma-card"><a><div class="card-image"><img width="960" height="540" loading="lazy" decoding="async" /><span class="new-badge">NEW</span></div><div class="card-body"><p class="eyebrow"></p><h2></h2><p data-name-en></p><span class="category"></span></div></a></article>
</template>
<script><import '../catalog/browser-app';</script>
```

Keep the existing first 24 server-rendered cards as the no-JavaScript fallback.

- [ ] **Step 4: Implement the DOM adapter**

In `browser-app.ts`, parse `#catalog-data`, call `parseCatalogQuery()` and `queryCatalog()`, clone the template for each visible item, set all text with `textContent`, set URLs through DOM properties, bind form submit/reset and pagination buttons, update `history.pushState`, and handle `popstate`. Never build card markup with untrusted `innerHTML`.

```ts
const data = JSON.parse(document.querySelector('#catalog-data')?.textContent || '[]') as BrowserCatalogItem[];
const render = (params: URLSearchParams, push: boolean) => {
  const result = queryCatalog(data, parseCatalogQuery(params));
  list.replaceChildren(...result.items.map(createCard));
  count.textContent = `${result.pagination.total} 件藏品`;
  if (push) history.pushState({}, '', params.size ? `/?${params}` : '/');
};
```

- [ ] **Step 5: Run unit and build tests**

Run: `pnpm vitest run src/catalog/browser-catalog.test.ts scripts/site-build.test.ts`

Expected: PASS, and `dist/index.html` contains the embedded snapshot but no API URL or raw JSON filename.

- [ ] **Step 6: Commit the static homepage flow**

```powershell
git add src/catalog/browser-app.ts src/pages/index.astro scripts/site-build.test.ts
git commit -m "feat: filter embedded catalog in browser"
```

### Task 3: Share image fallback behavior without public app.js

**Files:**
- Create: `src/client/image-fallback.ts`
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `src/pages/index.astro`
- Modify: `src/pages/chromas/[slug].astro`
- Delete: `public/app.js`

- [ ] **Step 1: Add a failing build assertion**

In `scripts/site-build.test.ts`, assert that no emitted file or HTML references `/app.js` and that a bundled `_astro/*.js` file exists.

```ts
expect(files.some((file) => file === 'app.js')).toBe(false);
expect(home).not.toContain('src="/app.js"');
expect(files.some((file) => /^_astro\/.*\.js$/.test(file))).toBe(true);
```

- [ ] **Step 2: Run the test and verify failure**

Run: `pnpm vitest run scripts/site-build.test.ts`

Expected: FAIL because `public/app.js` is still copied and referenced.

- [ ] **Step 3: Implement and load the shared fallback binder**

Export `bindImageFallbacks(root: ParentNode = document)` and use a `data-bound` guard. On the first error switch to `data-fallback`, on the second switch to `data-placeholder`. Import it once from a processed script in `BaseLayout.astro`, and call it for newly rendered homepage cards from `browser-app.ts`.

- [ ] **Step 4: Remove legacy script tags and public/app.js**

Delete the `/app.js` tags from homepage and detail page, then delete `public/app.js`.

- [ ] **Step 5: Run build tests and commit**

Run: `pnpm vitest run scripts/site-build.test.ts`

Expected: PASS.

```powershell
git add src/client/image-fallback.ts src/layouts/BaseLayout.astro src/pages/index.astro src/pages/chromas/[slug].astro scripts/site-build.test.ts public/app.js
git commit -m "refactor: bundle shared image fallback"
```

### Task 4: Make JSON validation independent of local images

**Files:**
- Create: `scripts/validate-data.test.ts`
- Modify: `scripts/validate-data.ts`

- [ ] **Step 1: Extract a testable validator and write failing tests**

Create tests showing that valid catalog JSON passes when no `assets/` directory exists and invalid schema still fails.

```ts
expect(validateCatalogFile(validJsonPath)).toEqual({ records: 1, imageReferences: 4 });
expect(() => validateCatalogFile(invalidJsonPath)).toThrow();
```

- [ ] **Step 2: Verify the current validator fails without local images**

Run: `pnpm vitest run scripts/validate-data.test.ts`

Expected: FAIL because validation currently requires every referenced image under a local `assets/` directory.

- [ ] **Step 3: Implement contract-only validation**

Make `validateCatalogFile(path)` read JSON, call `parseCatalog`, count unique image references, and return counts. The CLI prints `Validated N chromas and M remote image references.` It must not inspect the local filesystem for image files because the management system owns R2 synchronization.

- [ ] **Step 4: Run focused validation and real data validation**

Run: `pnpm vitest run scripts/validate-data.test.ts && pnpm data:validate`

Expected: both PASS and the real command reports 450 records or the current updated count.

- [ ] **Step 5: Commit the validator change**

```powershell
git add scripts/validate-data.ts scripts/validate-data.test.ts
git commit -m "refactor: validate remote image references"
```

### Task 5: Remove D1, runtime Worker, R2 sync, and GitHub Actions

**Files:**
- Create: `scripts/cloudflare-config.test.ts`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `tsconfig.json`
- Modify: `wrangler.jsonc`
- Modify/Rename: `scripts/release.test.ts` to `scripts/audit-build.test.ts`
- Delete: `worker/index.ts`, `worker/index.test.ts`, `worker/query.ts`, `worker/query.test.ts`
- Delete: `migrations/0001_create_chromas.sql`
- Delete: `scripts/prepare-release.ts`, `scripts/sync-r2.ts`, `scripts/cloudflare-init.ts`
- Delete: `.github/workflows/deploy.yml`, `.env.example`

- [ ] **Step 1: Write failing configuration tests**

Parse `wrangler.jsonc` after stripping comments and assert it has `name`, `compatibility_date`, and `assets.directory === './dist'`, but no `main`, `d1_databases`, or `vars`. Assert `package.json` has `release:build` and lacks `release:prepare`, `r2:sync`, and `cloudflare:init`.

- [ ] **Step 2: Run the test and verify failure**

Run: `pnpm vitest run scripts/cloudflare-config.test.ts`

Expected: FAIL because the current Wrangler and package scripts still contain D1/release settings.

- [ ] **Step 3: Simplify Wrangler and package scripts**

Use this Wrangler shape:

```json
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "lol-prestige-chroma-hub",
  "compatibility_date": "2026-07-13",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "404-page"
  }
}
```

Use `release:build` to run `test`, `typecheck`, `data:validate`, `build`, and `audit:build` in sequence. Keep `smoke` as an optional post-deploy command. Remove `@cloudflare/workers-types` and remove `worker/**/*.ts` plus its types from `tsconfig.json`.

- [ ] **Step 4: Delete obsolete runtime and release files**

Delete the listed Worker, D1, R2, initialization, environment, and GitHub Actions files. Reduce the release tooling test to the existing `auditBuild()` assertions and rename it `audit-build.test.ts`.

- [ ] **Step 5: Refresh the lockfile and run configuration tests**

Run: `pnpm install --lockfile-only && pnpm vitest run scripts/cloudflare-config.test.ts scripts/audit-build.test.ts`

Expected: PASS and `pnpm-lock.yaml` no longer contains `@cloudflare/workers-types` as a direct dependency.

- [ ] **Step 6: Commit the infrastructure removal**

```powershell
git add package.json pnpm-lock.yaml tsconfig.json wrangler.jsonc scripts .github .env.example worker migrations
git commit -m "refactor: deploy catalog as static worker assets"
```

### Task 6: Update static smoke and artifact verification

**Files:**
- Modify: `scripts/smoke.ts`
- Modify: `scripts/audit-build.ts`
- Modify: `scripts/audit-build.test.ts`
- Modify: `scripts/site-build.test.ts`

- [ ] **Step 1: Add failing assertions for the static-only release**

Test that the audit rejects a deployed `prestige-chromas.json`, source map, or D1 migration file, while allowing Astro hashed assets. Add a site-build assertion that no output file includes `/api/` or database artifacts.

- [ ] **Step 2: Run focused tests and verify the new assertion fails if unsupported**

Run: `pnpm vitest run scripts/audit-build.test.ts scripts/site-build.test.ts`

Expected: new assertions fail until audit rules are updated.

- [ ] **Step 3: Update audit and smoke logic**

Keep homepage and two detail-page checks. Remove the successful `/api/chromas` request and instead require `/api/chromas`, `/data/prestige-chromas.json`, `/api/export`, and `/chromas.json` to return 404. Keep representative R2 image checks using `imageUrl()`.

- [ ] **Step 4: Run focused tests and build audit**

Run: `pnpm vitest run scripts/audit-build.test.ts scripts/site-build.test.ts && pnpm build && pnpm audit:build`

Expected: PASS; audit reports the number of static files and finds no JSON/source-map/database leak.

- [ ] **Step 5: Commit verification changes**

```powershell
git add scripts/smoke.ts scripts/audit-build.ts scripts/audit-build.test.ts scripts/site-build.test.ts
git commit -m "test: verify static-only deployment"
```

### Task 7: Rewrite operator documentation for recurring JSON updates

**Files:**
- Modify: `README.md`
- Modify: `docs/chromaart.lol-Cloudflare部署手册.md`
- Modify: `docs/数据源与JSON结构.md`

- [ ] **Step 1: Rewrite README around the normal update flow**

State that the management system owns JSON generation and R2 images. Document the routine commands:

```powershell
pnpm install --frozen-lockfile
pnpm data:validate
pnpm release:build
git add data/prestige-chromas.json
git commit -m "data: update prestige chroma catalog"
git push origin main
```

Add the official button:

```markdown
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/LHiaoeng/lol-prestige-chroma-hub)
```

- [ ] **Step 2: Replace the deployment manual with the Workers Builds flow**

Document: connect the GitHub repository, select `main`, set build command to `pnpm release:build`, set deploy command to `pnpm exec wrangler deploy`, keep root directory blank, and verify the Worker name matches `wrangler.jsonc`. Retain concise custom-domain and DNS guidance, but remove D1, migrations, R2 upload credentials, GitHub Secrets, and Actions rollback instructions.

- [ ] **Step 3: Update the JSON contract document**

Make the display-site section say direct JSON replacement is the normal path, local images are not required, `pnpm data:validate` validates contract and references, and a push to `main` rebuilds all pages. Preserve the current field contract and Tag filename rules.

- [ ] **Step 4: Scan documentation for stale architecture terms**

Run:

```powershell
rg -n "D1|release:prepare|r2:sync|cloudflare:init|CLOUDFLARE_API_TOKEN|/api/chromas" README.md docs/chromaart.lol-Cloudflare部署手册.md docs/数据源与JSON结构.md
```

Expected: no stale operational instructions; any remaining occurrence explicitly says the component is no longer used.

- [ ] **Step 5: Commit documentation**

```powershell
git add README.md docs/chromaart.lol-Cloudflare部署手册.md docs/数据源与JSON结构.md
git commit -m "docs: document push-to-deploy catalog updates"
```

### Task 8: Run full release verification

**Files:**
- Modify only if verification exposes a defect in an in-scope file.

- [ ] **Step 1: Run the complete release build**

Run: `pnpm release:build`

Expected: all Vitest suites pass, Astro/TypeScript checks pass, the current JSON validates, Astro generates all routes, and artifact audit passes.

- [ ] **Step 2: Validate Wrangler configuration**

Run: `pnpm exec wrangler deploy --dry-run`

Expected: Wrangler accepts the assets-only configuration and prepares `dist` without requesting a D1 binding or Worker entry module.

- [ ] **Step 3: Inspect the final diff and repository state**

Run: `git diff --check && git status --short && git log --oneline -8`

Expected: no whitespace errors; only intentionally modified files remain, with implementation divided into focused commits.

- [ ] **Step 4: Record the Cloudflare dashboard handoff**

Report the exact first-time settings: production branch `main`, build command `pnpm release:build`, deploy command `pnpm exec wrangler deploy`, and no build secrets or D1/R2 bindings required. Do not claim a production push or deployment unless it was actually performed.

## Plan self-review

- Spec coverage: JSON-only data, recurring updates, local filtering, static details/SEO, removal of D1/API/R2 sync/Actions, Workers Builds, deploy button, failure behavior, smoke checks, and rollback are each mapped to tasks above.
- Placeholder scan: the plan contains no deferred implementation markers; every code-changing task names concrete files, behavior, commands, and expected results.
- Type consistency: `BrowserCatalogItem`, `CatalogQuery`, `CatalogResult`, `toBrowserCatalog`, `parseCatalogQuery`, and `queryCatalog` use the same names across unit, browser adapter, and page integration tasks.
