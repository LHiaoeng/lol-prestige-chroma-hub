# Prestige Chroma SEO Design

## Goal

Improve `https://chromaart.lol` search visibility for both broad English-language searches about League of Legends Prestige Chromas and long-tail searches for individual champions, skins, chroma variants, and splash art. The solution must remain fully data-driven so every future record added to `data/prestige-chromas.json` receives complete SEO coverage without page-specific maintenance.

## Terminology

- `CHROMA ART` is the site brand and the preferred site name.
- `Prestige Chroma` is the site's canonical English translation of 臻彩.
- A Prestige Chroma is described for external audiences as a China-exclusive League of Legends chroma variant with unique splash art.
- `Prestige Chroma` must not be described as the same product type as a traditional `Prestige Skin`.
- `League of Legends`, `LoL`, `Riot Games`, `chroma`, `skin`, `China-exclusive`, and `unique splash art` are supporting phrases used naturally where relevant, not repeated as keyword lists.

## Search Intent Architecture

### Home page

The home page targets broad discovery searches such as:

- League of Legends Prestige Chromas
- LoL Prestige Chroma splash arts
- China-exclusive League of Legends chromas
- unique chroma splash art

The home page remains the catalog route at `/`. Its title, description, H1, introductory copy, CollectionPage data, and catalog heading use consistent terminology.

### Detail pages

Each canonical `/chromas/{slug}/` page targets searches that combine the record's English chroma name, champion, base skin, and splash-art intent. SEO fields are generated from the normalized `Chroma` record, never stored or maintained separately.

The existing numeric `skinId` aliases remain outside the sitemap and continue to canonicalize to the descriptive slug. Removing or redirecting them is excluded from this SEO change because their external usage is unknown.

### About page

The About page targets informational searches about what Prestige Chromas are. It provides the primary definition that distinguishes Prestige Chromas from traditional Prestige Skins. Speculative pricing and acquisition claims should be replaced with careful, factual language or clearly qualified statements.

## SEO Module Boundaries

Create a focused `src/seo/` area:

- `src/seo/site.ts` owns the canonical origin, brand name, default social image, and global topic wording.
- `src/seo/chroma-seo.ts` converts a `Chroma` into its canonical URL, title, description, English image alt text, and JSON-LD graph.
- `src/seo/chroma-seo.test.ts` verifies terminology, stable URLs, record-derived keywords, escaping-safe values, and sensible title/description lengths for the current catalog.

`BaseLayout.astro` remains responsible for rendering metadata. Pages pass SEO values to it; they do not reconstruct site-wide constants. Existing `safeJsonLd` behavior remains the serialization boundary.

## Metadata Rules

### Global brand

- Use `CHROMA ART` consistently in title suffixes, `og:site_name`, structured data, and visible brand labels.
- Use `https://chromaart.lol` as the canonical origin.
- Do not include the domain text in page titles.

### Home page

- Preferred title: `League of Legends Prestige Chroma Splash Arts | CHROMA ART`.
- Description must mention China-exclusive Prestige Chromas, unique splash art, League of Legends, and continuously updated patch information in natural prose.
- The visible H1 defines the archive as China-exclusive League of Legends Prestige Chroma splash art.
- A short visible paragraph explains that these are chromas of existing skins with unique splash art, not traditional Prestige Skins.

### Detail pages

- Titles prioritize the record name and `Prestige Chroma Splash Art`, followed by the brand.
- The generator uses a shorter natural variant when a full title would become excessively long; it must not cut text mid-word.
- Descriptions include `nameEn`, `skinNameEn`, `League of Legends`, `China-exclusive Prestige Chroma`, `unique splash art`, and `gameVer` when the resulting sentence remains natural.
- Existing editorial `descriptionEn` remains visible page content, but it does not replace the search description because many supplied descriptions are skin lore and do not explain the page.
- Image alt text names the chroma and describes it as a China-exclusive Prestige Chroma splash art. Decorative background and category images retain empty alt text.

## Structured Data

The home page emits a JSON-LD graph containing:

- `WebSite` with `name: CHROMA ART`, canonical URL, and a useful alternate name.
- `CollectionPage` describing the archive and linking it to the website entity.

Each detail page emits:

- `ImageObject` with the record name, canonical page URL, crawlable `contentUrl`, representative image URL, and generated description.
- `BreadcrumbList` containing Home, the base skin label, and the canonical detail page.

Structured data describes content already visible on the page. It must not imply that CHROMA ART is Riot Games, that the site sells skins, or that Riot Games sponsors the site.

## Image Discovery

`src/pages/sitemap.xml.ts` remains data-driven and adds the sitemap image namespace. Every canonical detail URL includes its large splash-art URL and an English image title derived from the record. The sitemap continues to include `/` and `/about/` and excludes numeric aliases.

Image URLs remain on `https://img.chromaart.lol`; SEO-friendly image proxy paths are not introduced. Page context, alt text, captions, structured data, and the image sitemap provide the semantic signals because changing the existing R2 object layout would add migration risk without a proportional benefit.

## Language Strategy

English remains the indexed primary language because the audience is outside China. The existing client-side English/Chinese toggle remains in place. This change does not create `/zh/` routes or `hreflang` alternates because both languages currently share a URL and separate localized routing would be a larger information-architecture project.

English metadata and the default rendered English content must be complete without JavaScript. Chinese content may remain available to users through the existing language toggle.

## Continuous Growth

The SEO pipeline must work for any valid future catalog size:

1. `data:import` adds normalized records.
2. `parseCatalog` generates and validates descriptive slugs.
3. `getStaticPaths` generates canonical detail pages from `catalog`.
4. `chroma-seo.ts` derives metadata and structured data for every record.
5. `sitemap.xml.ts` derives canonical page and image entries from the same catalog.
6. Build audits verify that every canonical detail page has unique metadata and appears once in the sitemap.

No hard-coded catalog count, list of champions, or page-specific SEO override is permitted in the initial implementation.

## Validation and Tests

Extend the existing Vitest and build-audit coverage to verify:

- Home title, description, canonical, WebSite, and CollectionPage output.
- Every canonical detail page has a non-empty, record-specific title and description.
- Detail titles contain `CHROMA ART`; descriptions contain `League of Legends` and `Prestige Chroma`.
- Detail pages no longer use `prestige chroma` alt text without the China-exclusive context.
- Canonical detail URLs are unique.
- The sitemap contains `/`, `/about/`, and exactly one descriptive URL plus one large image URL for each catalog record.
- Numeric aliases do not appear in the sitemap.
- XML special characters are escaped in sitemap locations and image titles.
- JSON-LD remains safe against embedded `<`, `>`, U+2028, and U+2029 characters.

Run the full existing release verification after focused tests:

```text
pnpm test
pnpm typecheck
pnpm data:validate
pnpm build
pnpm audit:build
```

## Out of Scope

- Champion, skinline, category, or patch aggregation routes.
- Separate localized routes and hreflang.
- Search Console or Bing Webmaster account configuration.
- Backlink campaigns or external content publishing.
- R2 image-key migration.
- Product, Offer, price, rating, or availability structured data.
- Renaming internal source files, types, or import commands that currently use `prestige-chroma`.

## Acceptance Criteria

1. The brand is rendered consistently as `CHROMA ART` in SEO-facing metadata.
2. `Prestige Chroma` remains the canonical English term and is clearly defined for overseas users.
3. The home page targets the broad topic while every descriptive detail route targets record-specific long-tail searches.
4. Adding a valid catalog record automatically creates its SEO metadata, structured data, canonical page, and image sitemap entry.
5. Existing user-facing catalog, filters, language toggle, and image viewer behavior remain unchanged.
6. All focused tests and the complete release verification pass.
