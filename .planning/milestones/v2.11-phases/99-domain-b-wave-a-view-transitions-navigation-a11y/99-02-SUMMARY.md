---
phase: 99-domain-b-wave-a-view-transitions-navigation-a11y
plan: 02
subsystem: ui
tags: [view-transitions, svelte5, sveltekit, a11y, navigation, wcag, view-transition-name]

# Dependency graph
requires:
  - phase: 99-01
    provides: "shouldAnimate(destUrl) + typed startViewTransition guard in $lib/utils/viewTransition.ts; root-layout onNavigate VT coupling + afterNavigate [data-focus-on-nav] focus reset"
provides:
  - "view-transition-name placements across the EXPANDED VT-02 surface set (Header, MainContent, QuestionActions, question hero + heading on voter+candidate /questions, results election-switch, results entity tabs, entity-detail drawer tabs)"
  - "data-focus-on-nav + tabindex=-1 markers on the question heading (both apps) — the per-route half of NAVA11Y-02; the root afterNavigate focus hook now lands on the hgroup"
  - "opt-in transitionOnChange prop on the shared Tabs component (default false) wrapping the local activeIndex mutation in startViewTransition gated by shouldAnimate (O-1 local cross-fade for non-navigation tab switches)"
affects: [99-03 (a11y gate can now assert focus lands on data-focus-on-nav heading), 100 (questions-layout hoist — names live on shared components, not leaf wrapper divs)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Singleton chrome (Header, MainContent, QuestionActions) named IN-component — safe, never appears twice per snapshot"
    - "Shared components (Hero figure, QuestionHeading, results Tabs/AccordionSelect) named at the ROUTE CALLSITE via style/restProps so names stay unique-per-snapshot (Pitfall 4) and survive the Phase-100 layout hoist"
    - "view-transition-name on singleton chrome named via style: directive; at callsites via style= attribute flowing through restProps/concatClass"
    - "Local-state tab switch cross-fade: opt-in transitionOnChange wraps activeIndex mutation in startViewTransition(undefined-dest) — same shouldAnimate gate as the global hook, NOT new choreography"

key-files:
  created: []
  modified:
    - apps/frontend/src/routes/Header.svelte
    - apps/frontend/src/routes/MainContent.svelte
    - apps/frontend/src/lib/components/questions/QuestionActions.svelte
    - apps/frontend/src/routes/(voters)/(located)/questions/[questionId]/+page.svelte
    - apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte
    - apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte
    - apps/frontend/src/lib/components/tabs/Tabs.svelte
    - apps/frontend/src/lib/components/tabs/Tabs.type.ts
    - apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte

key-decisions:
  - "Header named via style:view-transition-name directive (consistent with the existing style: directives already on the <header>); the Pitfall-7 fix that stops the default ::view-transition(root) sliding the WHOLE viewport including chrome"
  - "QuestionActions named in-component (not at callsite) — it is voter-/questions-only and singleton-per-page, so a callsite name would be redundant"
  - "Heading focus markers (data-focus-on-nav, tabindex=-1) + view-transition-name passed at the QuestionHeading callsite — they flow through restProps onto the <hgroup> (the focus target HeadingGroup renders)"
  - "transitionOnChange added to TabsProps as an explicit typed prop (default false) so existing Tabs callsites (incl. the navigation-driven results tabs) are unaffected; only the entity-detail drawer opts in"
  - "O-1 honored, NOT deferred — the local wrapper was a clean prop-plus-conditional change; bind:activeIndex two-way flow and the drawer snapshot pairing were unaffected (the wrapper only moves the existing activeIndex assignment inside startViewTransition)"

requirements-completed: [VT-02, NAVA11Y-02]

# Metrics
duration: ~9min
completed: 2026-06-04
---

# Phase 99 Plan 02: view-transition-name placement + per-route a11y focus markers Summary

**Assigned `view-transition-name`s across the expanded VT-02 surface set (chrome, question hero/heading/actions on both apps, results election-switch + entity tabs, entity-detail drawer tabs) so Plan 01's onNavigate coupling produces element-stable cross-fades instead of a perceived full-page redraw, added the `data-focus-on-nav`/`tabindex=-1` heading markers that the root focus hook lands on (NAVA11Y-02 per-route half), and gave the shared `Tabs` an opt-in local-state cross-fade wrapper for the drawer tabs (O-1).**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-06-04
- **Completed:** 2026-06-04
- **Tasks:** 2
- **Files modified:** 9 (0 created, 9 modified)

## Accomplishments

- **Singleton chrome named in-component:** `persistent-header` on `<header>` (Pitfall-7 — without a stable name the default `::view-transition-*(root)` slides the whole viewport including chrome), `main-content` on the MainContent outer content div, `question-actions` on the QuestionActions `role="group"` div.
- **Shared question surfaces named at the callsite (both voter + candidate /questions):** `question-hero` on the hero `<figure>`, `question-heading` on the `QuestionHeading` callsite (flows through `restProps` → `<hgroup>`). Because both apps share `Hero`/`QuestionHeading`/`MainContent`, the callsite names cover both apps.
- **NAVA11Y-02 per-route half:** added `data-focus-on-nav` + `tabindex="-1"` to the `QuestionHeading` callsite on both apps; these flow onto the `<hgroup>` so the Plan-01 root `afterNavigate` rAF focus hook (`[data-focus-on-nav]` → first `<h1>` fallback) lands on the heading.
- **Conditional results surfaces named at the callsite:** `results-election-select` on `AccordionSelect` (renders only when `$dataRoot.elections.length > 1` — single-election seeds skip it; forwarded through AccordionSelect's `restProps`→outer div), `results-entity-tabs` on the results `<Tabs>` (renders only when `entityTabs.length > 1`). Both are navigation-driven (`goto(...)`), so the global `onNavigate` hook owns their animation — they intentionally do NOT pass `transitionOnChange`.
- **Opt-in local Tabs cross-fade (O-1):** added `transitionOnChange: boolean = false` to `Tabs` props (+ `Tabs.type.ts`). When true AND `shouldAnimate(undefined)`, the `activate()` `activeIndex` mutation is wrapped in `startViewTransition`; otherwise plain assignment. `onChange?.(...)` is still called unconditionally after, as before. The entity-detail drawer `<Tabs>` opts in and is named `entity-detail-tabs`, keeping `bind:activeIndex`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Name singleton chrome + shared question surfaces; add heading focus markers** — `49127e0ba` (feat)
2. **Task 2: Name conditional results surfaces + local Tabs view-transition wrapper (O-1)** — `3f1fa752f` (feat)

## Files Modified

- `apps/frontend/src/routes/Header.svelte` — `style:view-transition-name="persistent-header"` on `<header>`.
- `apps/frontend/src/routes/MainContent.svelte` — `style:view-transition-name="main-content"` on the outer content `<div>`.
- `apps/frontend/src/lib/components/questions/QuestionActions.svelte` — `style:view-transition-name="question-actions"` on the `role="group"` div.
- `apps/frontend/src/routes/(voters)/(located)/questions/[questionId]/+page.svelte` — `question-hero` on hero figure; `data-focus-on-nav` + `tabindex="-1"` + `question-heading` on QuestionHeading callsite.
- `apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte` — same hero + heading markers; `{#key question.id}` block left intact (Phase 100 owns the layout hoist).
- `apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte` — `results-election-select` on AccordionSelect, `results-entity-tabs` on the results Tabs.
- `apps/frontend/src/lib/components/tabs/Tabs.svelte` — imported `shouldAnimate`/`startViewTransition`; added `transitionOnChange` prop; conditional VT wrap in `activate()`.
- `apps/frontend/src/lib/components/tabs/Tabs.type.ts` — added `transitionOnChange?: boolean` (documented, default false).
- `apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte` — drawer Tabs opts into `transitionOnChange` + named `entity-detail-tabs`; `bind:activeIndex` preserved.

## Decisions Made

- **O-1 honored, not deferred.** The plan permitted a flagged deferral if the local wrapper broke the `bind:activeIndex` two-way flow or the drawer's snapshot pairing. It did neither — the change is purely the existing `activeIndex = index;` assignment moved inside `startViewTransition(() => { ... })` behind a default-false opt-in prop. No deferral was necessary.
- **`transitionOnChange` typed explicitly in `Tabs.type.ts`** rather than relying on the `SvelteHTMLElements['ul']` spread, so consumers get IntelliSense and the default-false contract is documented at the type level.
- **AccordionSelect / QuestionHeading style forwarding verified before relying on it:** AccordionSelect spreads `restProps` onto its outer `<div>` via `concatClass`; HeadingGroup spreads `restProps` onto its `<hgroup>`. Both `HeadingGroupProps` (`SvelteHTMLElements['hgroup']`) and AccordionSelect accept `style` + arbitrary `data-*`, so no type widening was needed.

## No view-transition-name collisions

The eight names are all distinct: `persistent-header`, `main-content`, `question-actions`, `question-hero`, `question-heading`, `results-election-select`, `results-entity-tabs`, `entity-detail-tabs`. No single rendered page carries two of the same name — the question-page names and the results-page names never co-render, and `entity-detail-tabs` lives inside a drawer. Names live on shared components / singleton chrome, so they survive the Phase-100 questions-layout hoist (forward-compat: no names on leaf-page wrapper divs Phase 100 may delete).

## Deviations from Plan

None — plan executed exactly as written. Both tasks landed their full acceptance-criteria set; O-1 was honored with the local wrapper (the permitted-but-not-required deferral path was not taken).

## Issues Encountered

- **Pre-existing repo-wide lint errors (out of scope, unchanged from 99-01):** `yarn lint:check` (full Turborepo graph) exits 1 due to pre-existing `simple-import-sort/imports` errors in unmodified test files and `no-unused-vars` warnings in `@openvaa/core` / `@openvaa/dev-seed`. None of the 9 files touched by this plan appear in the lint output (filtered grep returned empty), and each was individually verified lint-clean via `npx eslint` (exit 0). Already logged to `deferred-items.md` by 99-01; not re-logged.

## Verification

- `cd apps/frontend && yarn build` → exit 0 (`✓ built in ~9s`) after both tasks — Svelte parser + type check across all 8 source files + the type file.
- `npx eslint` on all 9 touched files → exit 0 (lint-clean individually).
- Full `yarn lint:check` filtered for my files → no matches (none of my files contribute lint errors).
- All Task 1 grep gates: `persistent-header`, `main-content`, `question-actions`, `data-focus-on-nav` (both apps), `question-hero` (both apps), `question-heading` — all present.
- All Task 2 grep gates: `results-election-select`, `results-entity-tabs`, `transitionOnChange` + `startViewTransition` + `shouldAnimate` (Tabs), `transitionOnChange` + `entity-detail-tabs` (EntityDetails) — all present.
- Visual / SR verification (cross-fade reads as element-stable; entity-detail tab cross-fades; focus lands on heading) is deferred to the manual-verification list in 99-VALIDATION.md (and the Plan 03 a11y gate).

## User Setup Required

None — no external service configuration. Pure CSS `view-transition-name` placement + a guarded local animation wrapper; no new auth/network/data surface (matches the plan threat model — no new trust boundaries).

## Known Stubs

None — every named surface is a real rendered element, and `transitionOnChange` is wired through to a live consumer (the entity-detail drawer). No placeholder data or empty-value flows introduced.

## Self-Check: PASSED

- FOUND: apps/frontend/src/routes/Header.svelte (persistent-header)
- FOUND: apps/frontend/src/routes/MainContent.svelte (main-content)
- FOUND: apps/frontend/src/lib/components/questions/QuestionActions.svelte (question-actions)
- FOUND: voter + candidate /questions pages (question-hero, question-heading, data-focus-on-nav, tabindex=-1)
- FOUND: results [[electionTab]] +layout.svelte (results-election-select, results-entity-tabs)
- FOUND: Tabs.svelte + Tabs.type.ts (transitionOnChange, startViewTransition, shouldAnimate)
- FOUND: EntityDetails.svelte (transitionOnChange, entity-detail-tabs)
- FOUND commit: 49127e0ba (Task 1)
- FOUND commit: 3f1fa752f (Task 2)
- yarn build → exit 0; touched files lint-clean

---
*Phase: 99-domain-b-wave-a-view-transitions-navigation-a11y*
*Completed: 2026-06-04*
