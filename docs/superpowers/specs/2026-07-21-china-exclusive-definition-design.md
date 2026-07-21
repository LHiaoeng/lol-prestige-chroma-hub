# China Exclusive Definition Design

## Goal

Use one precise meaning for `China Exclusive` across LoL Chroma Art: the standalone chroma splash art is presented on the Chinese League of Legends server, while the chroma itself may also be available in other regions.

## Terminology

- Preferred keyword phrase: `China-Exclusive Chroma Splash Art`.
- Canonical English definition: `“China Exclusive” describes the splash art shown on the Chinese League of Legends server—not necessarily the regional availability of the chroma itself.`
- Canonical Chinese definition: `“中国服专属”指独立炫彩原画在《英雄联盟》中国服务器中提供，并不表示该炫彩本身一定仅限中国服务器。`
- Do not describe a chroma as China-exclusive unless its regional availability has been verified separately.
- `Prestige Chroma` remains the English category label for 臻彩 and does not imply regional exclusivity.

## Application

- Keep `China-Exclusive Chroma Splash Art` in titles, headings, structured data, image titles, and alt text where it describes the artwork.
- Put the complete definition on the homepage and About page so users and search engines encounter the distinction directly.
- Use a concise equivalent in generated detail-page descriptions.
- Correct blog copy that currently discusses global chroma availability as if it defined `China Exclusive`.
- Keep acquisition guidance separate because chroma availability can vary by region, event, and patch.

## Architecture

Store the canonical bilingual definitions in `src/seo/` beside the site SEO configuration. Public pages and generated SEO descriptions consume those constants rather than maintaining competing definitions. Existing title and alt-text generators retain the proven keyword phrase.

## Verification

- Unit tests assert the canonical definition and generated detail descriptions distinguish artwork availability from chroma availability.
- Static page tests assert the homepage, About page, and prestige-chroma FAQ use the approved meaning.
- Existing title, structured-data, image-alt, sitemap, and build tests continue to protect the established keyword phrase.
