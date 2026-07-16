# Detail Action Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add configurable external-action dropdowns to the prestige chroma title and Base skin detail row.

**Architecture:** A focused domain helper builds correctly encoded external URLs. A reusable Astro component renders any supplied action subset through native `details`/`summary`; the detail page owns which actions appear for each item and always appends Google Search last.

**Tech Stack:** Astro, TypeScript, Vitest, native HTML `details`/`summary`

---

### Task 1: External detail-action URLs

**Files:**
- Create: `src/domain/detail-actions.test.ts`
- Create: `src/domain/detail-actions.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { googleSearchUrl, khadaModelUrl, skinSpotlightsSearchUrl } from './detail-actions';

describe('detail action URLs', () => {
  it('searches SkinSpotlights with only the skin name', () => {
    expect(skinSpotlightsSearchUrl('Panda Pal Lux (Obsidian)')).toBe(
      'https://www.youtube.com/c/SkinSpotlights/search?query=Panda+Pal+Lux+%28Obsidian%29',
    );
  });

  it('builds a KHADA base skin model URL', () => {
    expect(khadaModelUrl(99072)).toBe(
      'https://modelviewer.lol/model-viewer?id=99072&lang=en-US',
    );
  });

  it('builds a KHADA prestige chroma model URL from base and chroma IDs', () => {
    expect(khadaModelUrl(99072, 99080)).toBe(
      'https://modelviewer.lol/model-viewer?id=99072&lang=en-US&chroma=99080',
    );
  });

  it('prefixes a Google skin search with LEAGUE OF LEGENDS', () => {
    expect(googleSearchUrl('Panda Pal Lux (Obsidian)')).toBe(
      'https://www.google.com/search?q=LEAGUE+OF+LEGENDS+Panda+Pal+Lux+%28Obsidian%29',
    );
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm.cmd vitest run src/domain/detail-actions.test.ts`

Expected: FAIL because `src/domain/detail-actions.ts` does not exist.

- [ ] **Step 3: Implement the URL builders**

```ts
function searchUrl(base: string, parameter: string, keyword: string): string {
  const url = new URL(base);
  url.searchParams.set(parameter, keyword);
  return url.toString();
}

export function skinSpotlightsSearchUrl(keyword: string): string {
  return searchUrl('https://www.youtube.com/c/SkinSpotlights/search', 'query', keyword);
}

export function khadaModelUrl(skinId: number, chromaId?: number): string {
  const url = new URL('https://modelviewer.lol/model-viewer');
  url.searchParams.set('id', String(skinId));
  url.searchParams.set('lang', 'en-US');
  if (chromaId !== undefined) url.searchParams.set('chroma', String(chromaId));
  return url.toString();
}

export function googleSearchUrl(keyword: string): string {
  return searchUrl('https://www.google.com/search', 'q', `LEAGUE OF LEGENDS ${keyword}`);
}
```

- [ ] **Step 4: Run the test and verify GREEN**

Run: `pnpm.cmd vitest run src/domain/detail-actions.test.ts`

Expected: 4 tests pass.

- [ ] **Step 5: Commit the helper**

```powershell
git add -- src/domain/detail-actions.ts src/domain/detail-actions.test.ts
git commit -m "feat: build detail action URLs"
```

### Task 2: Configurable action-menu component

**Files:**
- Create: `src/components/DetailActionMenu.astro`

- [ ] **Step 1: Create a generic component that accepts any action subset**

```astro
---
export interface DetailAction {
  label: string;
  href: string;
  ariaLabel?: string;
}

interface Props {
  actions: DetailAction[];
}

const { actions } = Astro.props;
---
{actions.length > 0 && (
  <details class="detail-action-menu">
    <summary aria-label="Actions" data-aria-en="Actions" data-aria-zh="操作">
      <span data-en="Actions" data-zh="操作">Actions</span>
    </summary>
    <div class="detail-action-list">
      {actions.map((action) => (
        <a href={action.href} target="_blank" rel="noopener noreferrer" aria-label={action.ariaLabel ?? action.label}>
          {action.label}
        </a>
      ))}
    </div>
  </details>
)}

<style>
  .detail-action-menu { position: relative; flex: 0 0 auto; }
  summary { cursor: pointer; color: var(--gold); font-size: .7rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; list-style: none; }
  summary::-webkit-details-marker { display: none; }
  summary::after { content: " ▾"; }
  [open] summary::after { content: " ▴"; }
  .detail-action-list { position: absolute; z-index: 5; right: 0; top: calc(100% + 8px); width: max-content; min-width: 250px; display: grid; padding: 6px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel2); box-shadow: 0 16px 36px #0008; }
  a { padding: 10px 12px; border-radius: 5px; color: var(--text); font-size: .72rem; font-weight: 700; letter-spacing: .05em; }
  a:hover, a:focus-visible { color: var(--gold); background: #ffffff0a; }
</style>
```

- [ ] **Step 2: Run Astro type checking**

Run: `pnpm.cmd typecheck`

Expected: 0 errors, warnings, or hints.

- [ ] **Step 3: Commit the component**

```powershell
git add -- src/components/DetailActionMenu.astro
git commit -m "feat: add configurable detail action menu"
```

### Task 3: Configure menus on the detail page

**Files:**
- Modify: `src/pages/chromas/[slug].astro`

- [ ] **Step 1: Import the component and URL helpers**

Add these imports:

```ts
import DetailActionMenu from '../../components/DetailActionMenu.astro';
import { googleSearchUrl, khadaModelUrl, skinSpotlightsSearchUrl } from '../../domain/detail-actions';
```

- [ ] **Step 2: Define the two independently configurable action arrays**

Add after the localized metadata constants:

```ts
const prestigeChromaKeyword = chroma.nameEn;
const baseSkinKeyword = chroma.skinNameEn;
const prestigeChromaActions = [
  { label: 'VIEW ON SKINSPOTLIGHTS', href: skinSpotlightsSearchUrl(prestigeChromaKeyword) },
  { label: 'VIEW 3D MODEL ON KHADA', href: khadaModelUrl(chroma.sourceSkinId, chroma.skinId) },
  { label: 'GOOGLE SEARCH', href: googleSearchUrl(prestigeChromaKeyword) },
];
const baseSkinActions = [
  { label: 'VIEW ON SKINSPOTLIGHTS', href: skinSpotlightsSearchUrl(baseSkinKeyword) },
  { label: 'VIEW 3D MODEL ON KHADA', href: khadaModelUrl(chroma.sourceSkinId) },
  { label: 'GOOGLE SEARCH', href: googleSearchUrl(baseSkinKeyword) },
];
```

- [ ] **Step 3: Add the prestige chroma title menu**

Replace the standalone heading with:

```astro
<div class="detail-title-row">
  <h1 data-en={chroma.nameEn} data-zh={chroma.nameZh}>{chroma.nameEn}</h1>
  <DetailActionMenu actions={prestigeChromaActions} />
</div>
```

- [ ] **Step 4: Add the Base skin row menu**

Replace the Base skin row with:

```astro
<div>
  <dt data-en="Base skin" data-zh="原皮">Base skin</dt>
  <dd class="detail-value-with-actions">
    <span data-en={chroma.skinNameEn} data-zh={chroma.skinNameZh}>{chroma.skinNameEn}</span>
    <DetailActionMenu actions={baseSkinActions} />
  </dd>
</div>
```

- [ ] **Step 5: Add row layout styles**

Extend the page style with:

```css
.detail-title-row,
.detail-value-with-actions { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-width: 0; }
.detail-title-row h1 { min-width: 0; }
```

- [ ] **Step 6: Run focused and static checks**

Run: `pnpm.cmd vitest run src/domain/detail-actions.test.ts`

Expected: 4 tests pass.

Run: `pnpm.cmd typecheck`

Expected: 0 errors, warnings, or hints.

- [ ] **Step 7: Commit the integration**

```powershell
git add -- src/pages/chromas/[slug].astro
git commit -m "feat: add external actions to chroma details"
```
