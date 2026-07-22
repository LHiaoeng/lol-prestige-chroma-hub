# Dynamic Champion Coverage Blog Design

## Goal

Make `/blog/champions-without-prestige-chroma/` derive every visible champion-coverage fact from current data instead of maintaining a hard-coded champion list and fixed totals. Preserve SEO-friendly static HTML while refreshing the visible article from CommunityDragon when a visitor opens the page.

## Data sources

- League champion summary: `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-summary.json`
- Prestige chroma coverage: the unique `heroId` values from the build-time-only `data/prestige-chromas.json` catalog
- Chinese champion names: a small local ID-to-name presentation map. If a new CommunityDragon champion has no Chinese entry yet, display its English name rather than dropping the champion.
- Patch label: the highest `gameVer` in the local prestige chroma catalog. It updates whenever the catalog is replaced and the site is rebuilt.

The full prestige chroma JSON remains private to the build and must not be copied into `public/` or serialized into the page.

## CommunityDragon URL normalization

Add a focused TypeScript utility modeled on the referenced Java `AssetPathUtil` and `CommunityDragonUtil` behavior. It owns all conversion of CommunityDragon-relative asset paths used by this feature.

The utility will:

1. Trim and lowercase paths.
2. Convert `/lol-game-data/assets/<path>` to `plugins/rcp-be-lol-game-data/global/default/<path>`.
3. Accept already normalized `plugins/...` paths and recognized official CommunityDragon raw URLs.
4. Prefix normalized paths with `https://raw.communitydragon.org/latest/`.
5. Reject blank input, path traversal, backslashes, malformed paths, and absolute URLs outside the recognized CommunityDragon origin.

Every `squarePortraitPath` from champion-summary data must pass through this utility. Consumers must not concatenate CommunityDragon asset URLs independently.

## Domain model

Introduce pure, independently tested functions for:

- validating the champion-summary response with Zod;
- excluding placeholder records where `id <= 0`;
- deduplicating and matching champions by decimal string hero ID;
- computing total champions, covered champions, missing champions, and coverage percentage;
- producing the missing list in case-insensitive English-name A-Z order;
- attaching Chinese display names with English fallback;
- converting every portrait path through the shared URL utility.

The same calculation function must be used for both build-time HTML and browser refreshes so counts and prose cannot diverge.

## Build-time rendering

The Astro page fetches and validates the CommunityDragon champion summary during the build. A failed request, timeout, invalid schema, duplicate positive champion ID, or invalid asset path fails the build. This prevents publishing an empty or misleading article; the previously deployed static site remains available.

The computed snapshot supplies all visible data-dependent content in both languages, including:

- hero totals and coverage percentage;
- the count of champions still waiting;
- the full missing-champion list and portraits;
- article deck, overview text, list introduction, figure caption, and statistic cards;
- the latest local prestige catalog patch label.

The blog card summary, page meta description, and other SEO copy will not contain fixed counts. The initial HTML and structured data therefore remain meaningful and consistent even when CommunityDragon changes after deployment.

## Browser refresh

A minimal script in `src/client/` requests the same champion-summary URL after page load. The page embeds only the data needed to recompute coverage: covered hero IDs, the Chinese name map, and the local patch label.

After successful validation and calculation, the script updates every marked data-dependent element in both language versions as one operation. This includes prose, statistics, list rows, names, portrait URLs, and accessible labels. If the request or validation fails, the script leaves the complete build-time snapshot untouched. It must not clear existing content while loading.

Runtime refresh can immediately account for newly added League champions. Changes to prestige chroma coverage and the local patch label become available after the catalog is updated and the site is rebuilt, because the private catalog is intentionally not exposed as a runtime API.

## Accessibility and SEO

- The build output contains the complete article without requiring JavaScript.
- Refreshed portrait images retain explicit dimensions, lazy loading, decoding hints, and decorative empty alt text because the adjacent champion name is the accessible label.
- A polite status message announces a successful live refresh. Runtime failures keep the static snapshot and expose a non-blocking fallback state without interrupting screen-reader users.
- Canonical URL, article metadata, and JSON-LD remain server-rendered and count-free where freshness cannot be guaranteed.
- Both English and Chinese articles use the same calculated records and ordering.

## Testing

Follow test-driven development:

1. URL utility tests cover asset paths, plugin paths, official full URLs, lowercasing, traversal, arbitrary external URLs, and blank values.
2. Domain tests cover placeholder filtering, deduplication, coverage math, missing-list membership, A-Z sorting, Chinese fallback, and invalid payloads.
3. Page feature tests verify that all data-dependent text is marked for refresh, no fixed `173`, `105`, `68`, or `60.7%` literals remain in page source, and the full catalog is not serialized.
4. Client tests verify successful replacement and failure fallback through pure rendering/update inputs; DOM-specific behavior is kept minimal.
5. Run relevant Vitest files first, then `pnpm release:build` because the change affects data, SEO, browser behavior, and release output.

## Files expected to change

- A new CommunityDragon domain/URL utility and adjacent tests under `src/domain/`
- A minimal refresh module under `src/client/`
- `src/pages/blog/champions-without-prestige-chroma.astro`
- `src/blog/articles.ts` and its tests for count-free metadata
- Relevant blog/build feature tests
- `README.md`, `docs/frontend-design.md`, and data documentation describing the dual build/runtime update path

Existing unrelated working-tree changes must be preserved, and implementation edits must build on the currently promoted article rather than restoring the removed draft files.
