# Latest Chroma Hero Background Design

## Goal

Turn the homepage hero into a full-width cinematic banner using the newest prestige chroma splash art while preserving title readability and automatic data updates.

## Selected Direction

Use the approved full-bleed design. The artwork fills the hero from edge to edge with a strong dark gradient on the text side and a lighter treatment over the artwork subject.

## Data and Fallback

- Select the first catalog item marked `isNew`; fall back to the first catalog item when none is marked new.
- Render its large R2 image with the existing Tencent source URL as the fallback.
- Keep the image decorative because the hero text already describes the page.
- Load it eagerly with high fetch priority because it is the primary above-the-fold image.

## Layout and Styling

- Make the hero full viewport width while keeping text aligned to the existing 1240px content grid.
- Crop from the top on desktop and tune the focal point for narrow screens.
- Overlay a left-to-right dark gradient plus a subtle bottom fade.
- Add a restrained slow scale animation; disable it under `prefers-reduced-motion`.
- On mobile, strengthen the overlay and keep the heading within the safe text area.

## Scope

Do not change homepage wording, SEO metadata, filters, cards, or catalog behavior.

## Verification

Confirm the latest image URL and fallback are rendered, text remains readable at desktop and mobile breakpoints, and Astro type checking succeeds.
