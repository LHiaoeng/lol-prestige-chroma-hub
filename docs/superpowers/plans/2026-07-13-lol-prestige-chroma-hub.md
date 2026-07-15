# LOL Prestige Chroma Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the public, read-only Chroma Art site, its validated data pipeline, Cloudflare D1 search API, static SEO pages, and repeatable deployment workflow described in the approved design.

**Architecture:** Astro emits a fully static home shell, detail pages, sitemap, robots.txt, and 404 page from the normalized repository JSON. A small Cloudflare Worker handles only `/api/chromas`, executes an allow-listed parameterized D1 query pinned to `RELEASE_ID`, and delegates all other requests to Workers Static Assets. TypeScript command-line modules validate/import data, prepare release SQL, verify build artifacts, and synchronize R2 objects.

**Tech Stack:** Astro, TypeScript, Zod, Vitest, Cloudflare Workers/D1/R2, Wrangler, pnpm, GitHub Actions.

---

### Task 1: Project skeleton and domain model

**Files:**
- Create: `package.json`, `tsconfig.json`, `astro.config.mjs`, `vitest.config.ts`, `.gitignore`
- Create: `src/domain/chroma.ts`, `src/domain/chroma.test.ts`
- Create: `data/prestige-chromas.json`

- [ ] Write tests proving source records parse, URLs/slugs normalize deterministically, duplicate identifiers and slugs fail, and unsafe asset paths fail.
- [ ] Run `pnpm test src/domain/chroma.test.ts`; expect failure because the domain module does not exist.
- [ ] Implement the Zod schemas, `createSlug`, `parseCatalog`, Tencent/R2 URL helpers, and public record mapping.
- [ ] Re-run the focused test; expect all assertions to pass.

### Task 2: Cloudflare search API

**Files:**
- Create: `worker/query.ts`, `worker/query.test.ts`, `worker/index.ts`, `worker/index.test.ts`
- Create: `migrations/0001_create_chromas.sql`, `wrangler.jsonc`

- [ ] Write tests for defaults, every filter, sort allow-list, keyword length, page bounds, maximum page size 48, release isolation, bound SQL parameters, CORS/cache headers, and response field allow-listing.
- [ ] Run `pnpm test worker`; expect failure because Worker modules do not exist.
- [ ] Implement pure query parsing/SQL construction, then the Worker handler using D1 prepared statements and `env.ASSETS.fetch` fallback.
- [ ] Re-run Worker tests; expect all assertions to pass.

### Task 3: Static Astro site

**Files:**
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/components/ChromaCard.astro`, `src/components/Filters.astro`
- Create: `src/pages/index.astro`, `src/pages/chromas/[slug].astro`, `src/pages/404.astro`, `src/pages/robots.txt.ts`
- Create: `src/styles/global.css`, `public/favicon.svg`, `public/placeholder.svg`, `public/app.js`

- [ ] Write build assertions in `scripts/build-audit.test.ts` for the static first 24 cards, one detail route per catalog record, canonical/Open Graph/JSON-LD metadata, sitemap/robots/404 output, and absence of JSON/source maps.
- [ ] Run `pnpm test scripts/build-audit.test.ts`; expect failure because pages and audit module do not exist.
- [ ] Implement accessible responsive pages, URL-backed filters/pagination, API error/empty/loading states, image R2→Tencent→placeholder fallback, and reduced-motion styling.
- [ ] Build with `pnpm build`, implement the artifact audit, and re-run the focused tests.

### Task 4: Atomic data importer

**Files:**
- Create: `scripts/import-data.ts`, `scripts/import-data.test.ts`, `scripts/lib/image.ts`, `scripts/lib/fs-atomic.ts`

- [ ] Write tests with temporary directories and an injected fetch implementation for URL mapping, tag override/deduplication, skip/refresh/dry-run behavior, image signature/content-type/size validation, and no production mutation on partial failure.
- [ ] Run `pnpm test scripts/import-data.test.ts`; expect failure because importer modules do not exist.
- [ ] Implement staged downloads, catalog normalization, complete validation, and atomic directory/file replacement.
- [ ] Re-run importer tests; expect all assertions to pass.

### Task 5: Release preparation and deployment safeguards

**Files:**
- Create: `scripts/prepare-release.ts`, `scripts/prepare-release.test.ts`
- Create: `scripts/sync-r2.ts`, `scripts/sync-r2.test.ts`
- Create: `scripts/audit-build.ts`, `scripts/smoke.ts`
- Create: `.github/workflows/deploy.yml`

- [ ] Write tests for deterministic release IDs, D1 SQL escaping/transactions, R2 SHA-256 skip/update decisions, orphan asset reporting, and sensitive artifact rejection.
- [ ] Run the focused tests; expect failure because release modules do not exist.
- [ ] Implement release SQL generation, hash-based R2 sync, build audit, smoke checks, and ordered GitHub Actions gates (test → validate → R2 → D1 → build/audit → deploy → smoke → cleanup).
- [ ] Re-run the focused tests; expect all assertions to pass.

### Task 6: Documentation and full verification

**Files:**
- Create: `.env.example`, `README.md`
- Modify: `docs/chromaart.lol-Cloudflare部署手册.md` only if commands differ from the implemented CLI.

- [ ] Document local development, import flags, data contract, Cloudflare bindings/secrets, migrations, release flow, and rollback.
- [ ] Run `pnpm test`; expect zero failing tests.
- [ ] Run `pnpm typecheck`; expect exit code 0.
- [ ] Run `pnpm build && pnpm audit:build`; expect exit code 0 and no sensitive artifacts.
- [ ] Re-read the approved design and map every acceptance criterion to code, tests, configuration, or an explicitly documented first-deploy manual prerequisite.
