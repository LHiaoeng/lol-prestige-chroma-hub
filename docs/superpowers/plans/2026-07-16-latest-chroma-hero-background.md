# Latest Chroma Hero Background Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the newest prestige chroma large artwork as a cinematic, responsive homepage hero background.

**Architecture:** A small tested selector chooses the first `isNew` catalog entry and falls back to the first entry. The Astro homepage renders that entry's large image as a decorative eager-loaded layer, while scoped CSS supplies the approved full-bleed crop, gradients, content alignment, responsive treatment, and reduced-motion behavior.

**Tech Stack:** Astro, TypeScript, Vitest, CSS

---

### Task 1: Select the featured chroma

**Files:**
- Create: `src/domain/featured-chroma.test.ts`
- Create: `src/domain/featured-chroma.ts`

- [ ] **Step 1: Write the failing selector tests**

```ts
import { describe, expect, it } from 'vitest';
import { selectFeaturedChroma } from './featured-chroma';

describe('featured chroma selection', () => {
  it('selects the first new chroma', () => {
    const catalog = [
      { id: 1, isNew: false },
      { id: 2, isNew: true },
      { id: 3, isNew: true },
    ];
    expect(selectFeaturedChroma(catalog)).toBe(catalog[1]);
  });

  it('falls back to the first chroma', () => {
    const catalog = [{ id: 1, isNew: false }, { id: 2, isNew: false }];
    expect(selectFeaturedChroma(catalog)).toBe(catalog[0]);
  });

  it('returns undefined for an empty catalog', () => {
    expect(selectFeaturedChroma([])).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm.cmd vitest run src/domain/featured-chroma.test.ts`

Expected: FAIL because `src/domain/featured-chroma.ts` does not exist.

- [ ] **Step 3: Implement the generic selector**

```ts
export function selectFeaturedChroma<T extends { isNew: boolean }>(catalog: T[]): T | undefined {
  return catalog.find((item) => item.isNew) ?? catalog[0];
}
```

- [ ] **Step 4: Run the test and verify GREEN**

Run: `pnpm.cmd vitest run src/domain/featured-chroma.test.ts`

Expected: 3 tests pass.

### Task 2: Render and style the cinematic hero

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Import image helpers and select the featured entry**

Update the imports and frontmatter:

```ts
import { imageUrl, safeJsonLd, sourceImageUrl } from '../domain/chroma';
import { selectFeaturedChroma } from '../domain/featured-chroma';

const featuredChroma = selectFeaturedChroma(catalog);
```

- [ ] **Step 2: Add the decorative image and content wrapper**

Replace the hero section contents with:

```astro
<section class="hero-section">
  {featuredChroma && <img class="hero-background" src={imageUrl(featuredChroma.images.large)} data-fallback={sourceImageUrl('large', featuredChroma.instanceId)} data-placeholder="/placeholder.svg" alt="" aria-hidden="true" width="1920" height="1080" loading="eager" decoding="async" fetchpriority="high" />}
  <div class="hero-content">
    <p class="kicker" data-en="LEAGUE OF LEGENDS" data-zh="英雄联盟">LEAGUE OF LEGENDS</p>
    <h1><span data-language-content="en">China Exclusive<br /><em>Chroma Splash Arts</em></span><span data-language-content="zh">中国独家<br /><em>臻彩皮肤原画</em></span></h1>
    <p data-en="Discover high-resolution China Exclusive Chroma Splash Arts, updated as soon as each new patch goes live." data-zh="每次新版本上线后，第一时间更新英雄联盟中国独家臻彩高清原画。">Discover high-resolution China Exclusive Chroma Splash Arts, updated as soon as each new patch goes live.</p>
  </div>
</section>
```

- [ ] **Step 3: Add the approved full-bleed styles**

Append this scoped style block:

```astro
<style>
  .hero-section { position: relative; isolation: isolate; width: 100%; max-width: none; min-height: clamp(480px, 68vh, 720px); display: grid; align-items: center; overflow: hidden; padding: 80px 0; }
  .hero-background { position: absolute; z-index: -2; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center top; transform: scale(1.025); animation: hero-drift 18s ease-in-out infinite alternate; }
  .hero-section::after { content: ""; position: absolute; z-index: -1; inset: 0; background: linear-gradient(90deg, rgba(4,6,12,.96) 0%, rgba(4,6,12,.76) 38%, rgba(4,6,12,.3) 68%, rgba(4,6,12,.12) 100%), linear-gradient(0deg, rgba(9,11,21,.72), transparent 45%); }
  .hero-content { width: min(1240px, calc(100% - 48px)); margin-inline: auto; }
  .hero-content > p:last-child { max-width: 650px; color: #d4d6df; font-size: 1.05rem; text-shadow: 0 2px 18px #000; }
  .hero-content h1 { text-shadow: 0 5px 30px #000b; }
  @keyframes hero-drift { from { transform: scale(1.025); } to { transform: scale(1.065); } }
  @media (max-width: 680px) {
    .hero-section { min-height: 520px; padding: 64px 0; }
    .hero-background { object-position: 62% top; }
    .hero-section::after { background: linear-gradient(90deg, rgba(4,6,12,.92), rgba(4,6,12,.48)), linear-gradient(0deg, rgba(9,11,21,.9), rgba(9,11,21,.12) 75%); }
    .hero-content { width: min(100% - 28px, 1240px); }
  }
  @media (prefers-reduced-motion: reduce) { .hero-background { animation: none; transform: none; } }
</style>
```

- [ ] **Step 4: Run focused and static verification**

Run: `pnpm.cmd vitest run src/domain/featured-chroma.test.ts`

Expected: 3 tests pass.

Run: `pnpm.cmd typecheck`

Expected: 0 errors, warnings, or hints.

- [ ] **Step 5: Commit the implementation**

```powershell
git add -- src/domain/featured-chroma.ts src/domain/featured-chroma.test.ts src/pages/index.astro
git commit -m "feat: add latest chroma hero background"
```
