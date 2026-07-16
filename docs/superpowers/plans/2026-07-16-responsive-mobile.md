# Chroma Art Responsive Mobile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adapt every public page from 320px mobile screens through wide desktop screens, using an immersive mobile gallery, poster-style detail view, and three-column desktop catalog.

**Architecture:** Keep the existing Astro rendering and browser catalog behavior. Add semantic `details` wrappers for mobile navigation, filters, and detail metadata; centralize responsive tokens and breakpoints in `global.css`; keep component-specific overlay and dialog styling beside the owning Astro component.

**Tech Stack:** Astro 7, TypeScript 6, CSS, Vitest 4, native HTML `details` and `dialog`

---

## File map

- `scripts/responsive-layout.test.ts`: source-level responsive structure and CSS contract tests.
- `src/layouts/BaseLayout.astro`: semantic mobile navigation markup and navigation styles.
- `src/components/Filters.astro`: mobile-collapsible filter form without changing field names or catalog behavior.
- `src/styles/global.css`: shared responsive tokens, gallery breakpoints, controls, page layouts, and overflow protection.
- `src/pages/chromas/[slug].astro`: mobile poster overlay and expandable metadata panel.
- `src/components/DetailActionMenu.astro`: viewport-safe mobile action menu.
- `src/components/ImageViewer.astro`: dynamic-viewport and safe-area dialog sizing.
- `src/pages/about.astro`: mobile reading typography and spacing.
- `.gitignore`: exclude the local visual-companion session directory.

### Task 1: Lock the responsive structure contract

**Files:**
- Create: `scripts/responsive-layout.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('responsive layout contract', () => {
  it('provides semantic collapsible mobile navigation and filters', () => {
    expect(source('src/layouts/BaseLayout.astro')).toContain('class="mobile-nav"');
    expect(source('src/components/Filters.astro')).toContain('class="filter-disclosure"');
  });

  it('provides poster overlay and collapsible detail metadata', () => {
    const detail = source('src/pages/chromas/[slug].astro');
    expect(detail).toContain('class="detail-poster-copy"');
    expect(detail).toContain('class="detail-info-disclosure"');
  });

  it('uses the approved one, two, and three-column gallery progression', () => {
    const css = source('src/styles/global.css');
    expect(css).toContain('--touch-target:44px');
    expect(css).toMatch(/\.chroma-grid\{[^}]*grid-template-columns:repeat\(3/);
    expect(css).toMatch(/@media\(max-width:1023px\)[\s\S]*?\.chroma-grid\{grid-template-columns:repeat\(2/);
    expect(css).toMatch(/@media\(max-width:767px\)[\s\S]*?\.chroma-grid\{grid-template-columns:1fr/);
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm vitest run scripts/responsive-layout.test.ts`

Expected: three failing tests because the mobile navigation, filter disclosure, poster copy, detail disclosure, and approved gallery contract do not exist yet.

- [ ] **Step 3: Commit the failing contract test**

```bash
git add scripts/responsive-layout.test.ts
git commit -m "test: define responsive layout contract"
```

### Task 2: Implement global responsive foundations and navigation

**Files:**
- Modify: `src/styles/global.css`
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `.gitignore`

- [ ] **Step 1: Add semantic mobile navigation**

Add a `details.mobile-nav` alongside `.desktop-nav` with a 44px summary button and links for About and language switching. Keep the existing `data-language-toggle`, `data-en`, `data-zh`, and accessibility attributes on both language controls so `initializeLanguage` can bind them.

```astro
<details class="mobile-nav">
  <summary aria-label="Open menu" data-aria-en="Open menu" data-aria-zh="打开菜单"><span></span><span></span><span></span></summary>
  <nav class="mobile-nav-panel" aria-label="Mobile primary navigation">
    <a href="/about/" data-en="About" data-zh="关于">About</a>
    <button type="button" data-language-toggle data-en="中文" data-zh="EN" data-aria-en="Switch to Chinese" data-aria-zh="切换到英文">中文</button>
  </nav>
</details>
```

- [ ] **Step 2: Centralize responsive foundations**

Define `--page-gutter`, `--content-width`, and `--touch-target`; apply `overflow-x:clip`, safe-area header padding, three-column desktop gallery, two-column tablet gallery, and one-column mobile gallery. Restrict hover transforms to `(hover:hover) and (pointer:fine)` and make interactive controls at least 44px tall.

- [ ] **Step 3: Ignore visual companion artifacts**

Append `.superpowers/` to `.gitignore` so brainstorming screens remain local.

- [ ] **Step 4: Run the focused test**

Run: `pnpm vitest run scripts/responsive-layout.test.ts`

Expected: the navigation and gallery assertions pass; filter and detail assertions remain red.

- [ ] **Step 5: Commit**

```bash
git add .gitignore src/layouts/BaseLayout.astro src/styles/global.css
git commit -m "feat: add responsive foundations and mobile navigation"
```

### Task 3: Implement the mobile filter disclosure

**Files:**
- Modify: `src/components/Filters.astro`
- Modify: `src/styles/global.css`

- [ ] **Step 1: Wrap the unchanged form controls in a disclosure**

Use a `details.filter-disclosure` containing a translated summary and the existing `form.filters`. Retain every existing input/select name and the `data-filters` hook.

Insert `<details class="filter-disclosure" open>` immediately before the current `<form class="filters" data-filters role="search">`, add `<summary><span data-en="Filter & sort" data-zh="筛选与排序">Filter & sort</span><span aria-hidden="true">＋</span></summary>` as its first child, and close the `details` immediately after the current form. No form child, name, option, or data attribute changes.

- [ ] **Step 2: Add responsive filter styling**

Hide the summary while keeping the disclosure content open in layout at 768px and above. Below 768px, show the summary, give it a 44px target, render fields in one column, render action buttons in two equal columns, and remove page-level horizontal overflow.

- [ ] **Step 3: Run the focused test**

Run: `pnpm vitest run scripts/responsive-layout.test.ts`

Expected: navigation, filter, and gallery assertions pass; detail assertions remain red.

- [ ] **Step 4: Commit**

```bash
git add src/components/Filters.astro src/styles/global.css
git commit -m "feat: add collapsible mobile catalog filters"
```

### Task 4: Implement the immersive mobile detail page

**Files:**
- Modify: `src/pages/chromas/[slug].astro`
- Modify: `src/styles/global.css`
- Modify: `src/components/DetailActionMenu.astro`

- [ ] **Step 1: Add poster copy and metadata disclosure**

Keep the existing `ImageViewer` and action definitions. Add `.detail-poster-copy` inside `.detail-image` with the title, category, champion, and patch, and wrap the full definition list in `details.detail-info-disclosure`. Use duplicated display text only; retain the existing canonical title and action menus as the authoritative interactive content.

Inside the current `.detail-image`, place `.detail-poster-copy[aria-hidden="true"]` after `ImageViewer`. It contains the literal eyebrow `PRESTIGE CHROMA`, a localized title bound to `chroma.nameEn` / `chroma.nameZh`, and localized category, champion, and patch spans bound to the same expressions already used by the definition list. Wrap the complete current `.detail-copy` contents in `<details class="detail-info-disclosure" open>` with a localized `Details` / `详细资料` summary and a `.detail-info-body` child; do not remove or duplicate any action menu.

- [ ] **Step 2: Add desktop/mobile detail styles**

At 768px and above, hide poster copy and summary while keeping the metadata visible in the existing two-column layout. Below 768px, make the image full-bleed with `min-height:min(78svh,760px)`, add a bottom gradient overlay, show poster copy, hide the duplicate desktop title, and style the metadata as a bordered panel below the image.

- [ ] **Step 3: Make external action menus viewport-safe**

Change the list width to `min(250px, calc(100vw - 28px))`, increase summary/link targets to 44px on touch layouts, and allow link text to wrap.

- [ ] **Step 4: Run the focused test and full unit suite**

Run: `pnpm vitest run scripts/responsive-layout.test.ts`

Expected: all responsive contract tests pass.

Run: `pnpm test`

Expected: all project tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/pages/chromas/[slug].astro src/styles/global.css src/components/DetailActionMenu.astro
git commit -m "feat: add immersive responsive detail layout"
```

### Task 5: Polish secondary pages and overlays

**Files:**
- Modify: `src/components/ImageViewer.astro`
- Modify: `src/pages/about.astro`
- Modify: `src/styles/global.css`

- [ ] **Step 1: Make the image dialog safe on mobile**

Use `max-height:calc(100dvh - 16px)`, safe-area padding, a sticky 44px close button, and `overscroll-behavior:contain` while keeping the full image contained.

- [ ] **Step 2: Apply secondary-page responsive polish**

Use the shared page gutter on About, reduce phone heading sizes and section spacing, allow breadcrumb horizontal scrolling, let pagination wrap, and ensure 404 and footer spacing fit 320px screens.

- [ ] **Step 3: Run static verification**

Run: `pnpm test && pnpm typecheck && pnpm build`

Expected: all tests pass, Astro/TypeScript checks report no errors, and the production build exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/components/ImageViewer.astro src/pages/about.astro src/styles/global.css
git commit -m "fix: polish responsive pages and image viewer"
```

### Task 6: Perform responsive visual acceptance

**Files:**
- Modify only if visual defects are found in the files above.

- [ ] **Step 1: Start the local site**

Run: `pnpm dev --host 127.0.0.1`

Expected: Astro prints a local URL and remains available for browser inspection.

- [ ] **Step 2: Inspect required viewports**

Inspect home, a generated detail route, About, 404, and the image dialog at 320×568, 375×812, 430×932, 768×1024, 1024×768, and 1440×900. Confirm no page-level horizontal scroll, no overlap, readable labels, usable menus, and correct one/two/three-column progression.

- [ ] **Step 3: Re-run release verification after any visual fixes**

Run: `pnpm release:build`

Expected: tests, typecheck, data validation, production build, and build audit all exit 0.

- [ ] **Step 4: Review the final diff**

Run: `git status --short && git diff --check && git log --oneline -6`

Expected: only intentional changes remain, no whitespace errors are reported, and responsive commits are visible.
