# Visible Desktop, Collapsible Mobile Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the complete detail list and home filters visible on desktop while presenting each as a complete, touch-friendly collapsible panel on phones.

**Architecture:** Reuse the existing semantic `details` wrappers and full field markup. Remove only the redundant mobile shortcut navigation, then lock desktop visibility and mobile collapsed behavior through CSS and a static responsive contract test.

**Tech Stack:** Astro, TypeScript, CSS, Vitest

---

### Task 1: Define the restored-content contract

**Files:**
- Modify: `scripts/responsive-layout.test.ts`

- [ ] Add assertions that `Filters.astro` has no `filter-shortcuts`, retains all six named controls, and keeps `filter-disclosure`.
- [ ] Add assertions that the detail page retains the complete `dl`, uses `detail-info-disclosure`, and keeps the mobile closed-state selector.
- [ ] Run `pnpm.cmd vitest run scripts/responsive-layout.test.ts`; expect failure because `filter-shortcuts` still exists.

### Task 2: Restore the full home filter presentation

**Files:**
- Modify: `src/components/Filters.astro`
- Modify: `src/styles/global.css`

- [ ] Remove the `filter-shortcuts` navigation and its focus script, leaving the complete form inside `filter-disclosure`.
- [ ] Remove shortcut CSS while preserving desktop `.filter-disclosure>summary{display:none}` and `.filters{display:grid}`.
- [ ] Preserve the phone rules that show the summary, hide the form only while closed, and lay out search full-width plus remaining controls in two columns.
- [ ] Run the focused responsive test; expect PASS.

### Task 3: Confirm complete responsive detail information

**Files:**
- Modify only if required: `src/pages/chromas/[slug].astro`
- Modify: `scripts/responsive-layout.test.ts`

- [ ] Assert the page includes Category, Category icon, Colors, Base skin, Skinlines, Universes, Champions, Patch, and both localized description rows.
- [ ] Ensure desktop always displays `.detail-info-body`, while phones show the summary and hide the body only when the details element is closed.
- [ ] Run `pnpm.cmd vitest run scripts/responsive-layout.test.ts`; expect PASS after the minimal markup/style correction, if any.

### Task 4: Verify and commit

**Files:**
- Test: `scripts/responsive-layout.test.ts`

- [ ] Run `pnpm.cmd release:build`; expect 76 tests, zero type errors, valid data, and a successful static build audit.
- [ ] Verify phone and desktop visibility with the local browser at 375px and 1024px, including expand/collapse and horizontal overflow.
- [ ] Run `git diff --check` and commit the implementation as `fix: restore responsive detail and filter content`.
