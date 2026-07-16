# Detail Action Menu Design

## Scope

Add external action menus for the prestige chroma title and the Base skin row on each detail page. Other metadata rows remain unchanged.

## Behavior

- The prestige chroma menu searches SkinSpotlights with the English champion and prestige chroma names, and opens KHADA with `skinId`.
- The Base skin menu searches SkinSpotlights with the English champion and base skin names, and opens KHADA with `sourceSkinId`.
- SkinSpotlights URL: `https://www.youtube.com/c/SkinSpotlights/search?query={encoded keyword}`.
- KHADA URL: `https://modelviewer.lol/model-viewer?id={id}&lang=en-US`.
- Both destinations open in a new tab with safe external-link attributes.
- The compact trigger sits at the end of the applicable row. Brand action labels remain English in both site languages.

## Structure

Keep URL construction in a small tested TypeScript helper. Render the menu through a reusable Astro component using native `details` and `summary` elements, so it works without client-side JavaScript and remains keyboard accessible.

The component receives an action array instead of hard-coding destinations. Each detail item independently chooses which actions to pass, and an item with no configured actions renders no menu. Each action provides its label, URL, and optional accessibility label. This keeps the current two destinations simple while allowing more menu entries and different action subsets per detail item later.

## Error Handling

URL construction uses `URL` and `URLSearchParams` to encode search keywords. IDs come from the validated catalog schema, so the component does not render fallback or disabled actions.

## Verification

Unit-test the two URL builders before implementation, then run the targeted unit test and Astro/TypeScript checks.
