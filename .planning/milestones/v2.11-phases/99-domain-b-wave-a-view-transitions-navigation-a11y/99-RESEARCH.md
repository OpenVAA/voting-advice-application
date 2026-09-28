# Phase 99: Domain B Wave A — View Transitions + Navigation a11y - Research

**Researched:** 2026-06-04
**Domain:** SvelteKit View Transitions API + WCAG 2.1 AA navigation a11y (focus management, route announcement, reduced-motion)
**Confidence:** HIGH — the design is browser-verified by spikes 013–016 and a complete production-shaped reference scaffold already exists in-tree at `routes/runes-test/nav-a11y/`. This research is a *code-grounding* pass: it maps the proven patterns onto the real files the planner must edit.

## Summary

The DESIGN is locked by spikes 013–016 (do NOT re-decide). This phase wires three proven mechanisms into the production app:
1. **View Transitions** — a global `onNavigate` hook at the ROOT layout (`apps/frontend/src/routes/+layout.svelte`) that wraps SvelteKit's DOM swap in `document.startViewTransition`, plus per-element `view-transition-name` CSS on chrome + content surfaces.
2. **Navigation a11y** — an `aria-live="polite"` route announcer + an `afterNavigate` focus-reset hook (`requestAnimationFrame` → `focus({ preventScroll: true })`), with a `data-focus-on-nav` / `tabindex="-1"` target on the question heading.
3. **Reduced-motion** — `matchMedia` short-circuit in JS + a `@media (prefers-reduced-motion: reduce) { :global(::view-transition-*) }` CSS block (correct Svelte-parser form).

A complete, working reference implementation lives at `apps/frontend/src/routes/runes-test/nav-a11y/+layout.svelte` (spike 016) — the planner can lift its `shouldAnimate()`, `onNavigate`, `afterNavigate`, announcer, and `<style>` block almost verbatim. The non-trivial work is (a) integrating with the root layout's EXISTING `onNavigate`/`afterNavigate`/`beforeNavigate` hooks without breaking analytics, (b) placing `view-transition-name`s on the right real components, and (c) auditing which of the 99-1 EXPANDED surfaces are actually reachable.

**Primary recommendation:** Adapt the spike-016 `nav-a11y/+layout.svelte` scaffold into the real `routes/+layout.svelte` (merging hooks, not replacing them), add `view-transition-name` CSS to `Header.svelte` / `MainContent.svelte` / `Hero`+`HeroEmoji` / `QuestionActions.svelte` / `QuestionHeading.svelte` (the 4 spike-proven elements) and to the reachable 99-1 surfaces (results election-select, results entity `Tabs`, entity-detail `Tabs`), wire the announcer + focus into the root layout, and extend the existing `a11y-smoke.spec.ts` (gated by `PLAYWRIGHT_A11Y=1`) rather than inventing a new harness.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01 (99-1) — EXPANDED VT surface scope:** Assign `view-transition-name`s beyond the 4 spike-proven elements (Header / MainContent / hero / QuestionActions) to **also cover, where applicable:** results **election-switching**, **entity tabs** in results, **tabs in entity details**, **`QuestionHeading`**, the **candidate-app `/questions` route**. Planner must **audit which of these surfaces are reachable/animatable** and size the phase accordingly. Same cross-fade applied to more surfaces — NOT bespoke per-route choreography.
- **D-02 (99-2):** Ship the `?notr=1` escape hatch (disables the transition) in production — useful for E2E + debugging. Low cost, spike-proven.
- **D-03 (99-3):** The `aria-live="polite"` announcer derives from `page.params` and announces a **generic param-derived label** (e.g. "Question {n}"). No new localized announcement strings in this phase.
- **D-04 (99-4):** Global `onNavigate` cross-fade at the root layout (all routes), reading `navigation.to?.url` (NOT `page.url`) for destination decisions.
- **D-05:** `prefers-reduced-motion` honored on BOTH layers (`matchMedia` short-circuit in JS + `@media (prefers-reduced-motion: reduce) { :global(...) }` CSS — correct Svelte-parser form).
- **D-06:** Focus reset via `afterNavigate` → `requestAnimationFrame(() => target.focus({ preventScroll: true }))` (`preventScroll` mandatory); question heading carries `data-focus-on-nav` / `tabindex="-1"`.
- **D-07:** WCAG 2.1 AA gate (focus + aria-live + reduced-motion) under the existing `@axe-core/playwright` env-gated smoke.

### Claude's Discretion
- Exact `view-transition-name` strings + which reachable sub-surfaces qualify as "where applicable" for D-01 (document what was covered vs skipped).

### Deferred Ideas (OUT OF SCOPE)
- Bespoke per-route animation choreography beyond the cross-fade.
- The questions-layout restructure (hoist `[questionId]/+page.svelte` rendering into `questions/+layout.svelte`) — that is **Phase 100 / QLAYOUT-01/02 (Wave B)**.
- Any rune-migration work (Domain A).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VT-01 | Root layout couples navigation to View Transitions API via `onNavigate(...startViewTransition...)`, reading `navigation.to?.url` not `page.url`. | Wire into `apps/frontend/src/routes/+layout.svelte` (§Architecture). MUST coexist with the existing `onNavigate(() => submitAllEvents())` at line 157. Reference impl: `runes-test/nav-a11y/+layout.svelte:30-46`. |
| VT-02 (EXPANDED) | `view-transition-name`s for element-stable cross-fades on the 4 spike-proven elements PLUS reachable 99-1 surfaces. | Component-by-component map in §Component Responsibilities + §VT-02 Surface Audit. |
| VT-03 | `prefers-reduced-motion` honored on BOTH layers. | `shouldAnimate()` `matchMedia` check + `<style>` `@media` block — both in the spike scaffold (`nav-a11y/+layout.svelte:22-28, 163-169`). |
| NAVA11Y-01 | `aria-live="polite"` route announcer, text from `page.params`, NOT `<svelte:head><title>`. | Announcer block `nav-a11y/+layout.svelte:89-93`. Place in root layout or `Layout.svelte`. |
| NAVA11Y-02 | Focus reset via `afterNavigate` → `rAF(() => focus({ preventScroll: true }))`; heading carries `data-focus-on-nav` / `tabindex="-1"`. | `afterNavigate` block `nav-a11y/+layout.svelte:48-67`. Heading target = `QuestionHeading.svelte` `<h1>`/`<hgroup>` (§Focus Target). |
| NAVA11Y-03 | Transition stack passes WCAG 2.1 AA under the existing `@axe-core/playwright` env-gated smoke. | Extend `tests/tests/specs/a11y/a11y-smoke.spec.ts` (project `a11y-smoke`, gated `PLAYWRIGHT_A11Y=1`). §Validation Architecture. |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Navigation → View Transition coupling | Frontend Server (SSR) → Browser | — | `onNavigate` is a client-only SvelteKit hook; runs in the browser after hydration. Guard with `typeof document === 'undefined'`. |
| `view-transition-name` element pairing | Browser | — | Pure CSS property; browser pairs old/new snapshots. No server involvement. |
| Route announcer (`aria-live`) | Browser (DOM) | — | Reactive DOM text driven by `page.params`; SSR-rendered then reactively updated. |
| Focus management | Browser | — | `afterNavigate` + `element.focus()` are DOM-only. |
| Reduced-motion preference | Browser | — | `matchMedia` (JS) + `@media` (CSS) both client-side. |
| a11y regression gate | Test harness (Playwright + axe) | — | Env-gated project, runs against the live dev/preview server. |

**No backend / API / database tier involvement.** This phase is entirely client-side rendering + CSS + test additions.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| SvelteKit | 2.x (in-repo) | `onNavigate` / `afterNavigate` / `beforeNavigate` hooks from `$app/navigation`; `page` from `$app/state` | Already the app framework; hooks are the native integration point for View Transitions per the official SvelteKit View Transitions guide. `[CITED: svelte.dev/docs/kit/page-transitions]` |
| View Transitions API | Browser-native (`document.startViewTransition`) | Wraps DOM swap in animated cross-fade | Chrome 111+, Edge 111+, Firefox 144+, Safari 18+; feature-detect via `'startViewTransition' in document`. `[VERIFIED: spike 015 README + browser-verified]` |
| `@axe-core/playwright` | in-repo (`tests/`) | WCAG 2.1 AA regression scan | Already the project's a11y gate (`a11y-smoke.spec.ts`). `[VERIFIED: codebase grep]` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@playwright/test` | in-repo | E2E harness for the a11y smoke + optional `?notr=1` determinism | Extending NAVA11Y-03 gate. |

**No new dependencies required.** Everything is in-repo (SvelteKit, axe-core/playwright) or browser-native (View Transitions, `matchMedia`). `[VERIFIED: codebase grep — no new package installs needed]`

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native View Transitions API | svelte `transition:`/`crossfade` directives | Rejected by spikes — native VT captures the WHOLE render window (chrome + content) and pairs elements by name; svelte transitions only animate mount/unmount of specific nodes and can't cross-fade reused `+page.svelte` content. Spike 015 §Results point 6. |
| `<svelte:head><title>` for SR announce | aria-live region | Rejected (NAVA11Y-01 / spike 016): NVDA + JAWS often don't announce SPA title changes; aria-live is the universal fix. |

## Package Legitimacy Audit

> Not applicable — this phase installs **zero** external packages. All mechanisms are browser-native (View Transitions API, `matchMedia`) or already-installed in-repo (`@axe-core/playwright`, `@playwright/test`, SvelteKit). No registry verification or slopcheck needed.

## Architecture Patterns

### System Architecture Diagram

```
User clicks nav link (Q→Q, tab switch, election switch, drawer open)
        │
        ▼
SvelteKit onNavigate(navigation)  ─── ROOT layout: apps/frontend/src/routes/+layout.svelte
        │
        ├── shouldAnimate(navigation.to?.url)?   ◄── reads DESTINATION url (NOT page.url)
        │      ├── no document.startViewTransition → return (instant swap)
        │      ├── prefers-reduced-motion: reduce → return (instant swap)   [VT-03 layer 1]
        │      └── dest url has ?notr=1 → return (instant swap)             [escape hatch D-02]
        │
        ▼ (animate path)
   return new Promise(resolve =>
       document.startViewTransition(async () => {
          resolve();                 ── tells SvelteKit to apply new DOM
          await navigation.complete; ── SvelteKit swaps DOM here
       }))
        │
        ▼  browser snapshots BEFORE → applies new DOM → snapshots AFTER → animates
   per-element pairing via view-transition-name:   [VT-02]
     persistent-header (Header) | main-content (MainContent) |
     question-hero (Hero) | question-actions (QuestionActions) |
     question-heading (QuestionHeading) | results-election-select |
     results-entity-tabs | entity-detail-tabs
        │
        ▼
SvelteKit afterNavigate({to, type})  ─── runs AFTER DOM swap, BEFORE vt-finished
        │
        ├── requestAnimationFrame(() =>
        │      target = [data-focus-on-nav] ?? <h1>
        │      target.focus({ preventScroll: true }))   [NAVA11Y-02 — preventScroll mandatory]
        │
        └── (reactive) aria-live announcer text = `Question ${page.params.questionId}`  [NAVA11Y-01]
        │
        ▼
   ~272ms cross-fade plays with focus ring already on new element  (spike 016 timing)
        │
        ▼
  CSS @media (prefers-reduced-motion: reduce) nulls any escaped animation  [VT-03 layer 2]
```

### Recommended Edit Surface (files to touch — NOT a new structure)
```
apps/frontend/src/routes/
├── +layout.svelte          # WIRE onNavigate(VT) + afterNavigate(focus) — MERGE with existing hooks
│                           #   + reduced-motion <style> block + (optionally) announcer
├── Layout.svelte           # candidate location for aria-live announcer (wraps <main>) — or root layout
├── Header.svelte           # add view-transition-name: persistent-header to <header>
├── MainContent.svelte      # add view-transition-name: main-content to outer content div
└── (voters)/(located)/
    ├── questions/[questionId]/+page.svelte   # data-focus-on-nav on QuestionHeading; names on hero/actions
    └── results/[[electionTab]]/+layout.svelte # names on AccordionSelect (election) + Tabs (entity tabs)

apps/frontend/src/lib/
├── components/hero/Hero.svelte + heroEmoji/HeroEmoji.svelte  # view-transition-name: question-hero
├── components/questions/QuestionActions.svelte               # view-transition-name: question-actions
├── components/tabs/Tabs.svelte                               # (shared) name for results+entity-detail tabs
└── dynamic-components/questionHeading/QuestionHeading.svelte # data-focus-on-nav + tabindex=-1 + name

tests/tests/specs/a11y/a11y-smoke.spec.ts   # extend with focus/announcer/reduced-motion assertions
```

### Pattern 1: onNavigate → startViewTransition coupling (VT-01)
**What:** Return a Promise from `onNavigate`; inside it call `startViewTransition`, resolve to let SvelteKit swap DOM, await `navigation.complete`.
**When to use:** Root layout, all routes.
**Example (VERBATIM from the in-tree spike scaffold):**
```ts
// Source: apps/frontend/src/routes/runes-test/nav-a11y/+layout.svelte:22-46  [VERIFIED: codebase]
function shouldAnimate(destUrl: URL | undefined): boolean {
  if (typeof document === 'undefined') return false;
  if (!document.startViewTransition) return false;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
  if (destUrl?.searchParams.get('notr') === '1') return false;   // ?notr=1 escape hatch (D-02)
  return true;
}

onNavigate((navigation) => {
  if (!shouldAnimate(navigation.to?.url)) return;   // DESTINATION url — NOT page.url (spike-015 gotcha)
  return new Promise((resolve) => {
    const transition = document.startViewTransition(async () => {
      resolve();
      await navigation.complete;
    });
    // transition.finished.then(...) optional
  });
});
```

### Pattern 2: afterNavigate focus reset (NAVA11Y-02)
```ts
// Source: apps/frontend/src/routes/runes-test/nav-a11y/+layout.svelte:48-67  [VERIFIED: codebase]
afterNavigate(({ to, type }) => {
  if (typeof document === 'undefined') return;
  requestAnimationFrame(() => {
    const target =
      document.querySelector<HTMLElement>('[data-focus-on-nav]') ??
      document.querySelector<HTMLElement>('h1');
    target?.focus({ preventScroll: true });   // preventScroll MANDATORY (fights goto({noScroll}))
  });
});
```

### Pattern 3: aria-live route announcer (NAVA11Y-01)
```svelte
<!-- Source: apps/frontend/src/routes/runes-test/nav-a11y/+layout.svelte:89-93  [VERIFIED: codebase] -->
<div aria-live="polite" aria-atomic="true" class="sr-only" id="route-announcer">
  {page.params.questionId ? `Question ${page.params.questionId}` : 'Questions list'}
</div>
```
Note: D-03 says "generic param-derived label" — the spike uses the raw `questionId` string. The planner should derive a stable generic label from `page.params` (e.g. position/index if cheaply available, else the param value). No NEW localized i18n strings this phase.

### Pattern 4: reduced-motion CSS belt-and-braces (VT-03 layer 2)
```css
/* Source: apps/frontend/src/routes/runes-test/nav-a11y/+layout.svelte:163-169  [VERIFIED: codebase] */
@media (prefers-reduced-motion: reduce) {
  :global(::view-transition-group(*)),
  :global(::view-transition-old(*)),
  :global(::view-transition-new(*)) {
    animation: none !important;
  }
}
```
**LANDMINE:** `:global(@media ...)` is REJECTED by the Svelte CSS parser ("Expected a valid CSS identifier"). The `@media` rule MUST wrap the `:global(...)` selector, never the reverse. `[VERIFIED: spike 015 Iteration 2]`

### Anti-Patterns to Avoid
- **Reading `page.url` in `onNavigate`** → gives the SOURCE url during navigation, not the destination. Always use `navigation.to?.url`. This breaks the `?notr=1` escape hatch silently. `[VERIFIED: spike 015 Iteration 3]`
- **`:global(@media ...)`** → Svelte parser error. Use `@media { :global(...) }`.
- **`focus()` without `{ preventScroll: true }`** → fights `goto({ noScroll: true })` (used at `questions/[questionId]/+page.svelte:159` and `results/[[electionTab]]/+layout.svelte`), producing inconsistent scroll jumps. `[VERIFIED: spike 016 Iteration 5]`
- **Announcing via `<svelte:head><title>`** → unreliable on NVDA/JAWS for SPA route changes.
- **Replacing the root layout's existing `onNavigate`/`afterNavigate`** → those carry analytics (`submitAllEvents`, `startPageview`). MERGE, don't overwrite (see §Coexistence below).
- **Doing the Phase-100 questions-layout restructure here** → out of scope; name transition surfaces so they survive that later hoist (see §Phase 100 forward-compat).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-fade between reused page content | Custom svelte `transition:` choreography per route | Native `document.startViewTransition` + `view-transition-name` | The page component is REUSED across param-only nav (spike 013/014) — svelte transitions can't fire because nothing mounts/unmounts. Only the View Transitions API captures the reactive DOM regeneration. |
| SPA route SR announcement | Custom focus-stealing or `<title>` polling | `aria-live="polite"` region | Browser/SR-native, zero JS timing risk. |
| Reduced-motion detection | Custom media-query listener wiring | `matchMedia(...).matches` (JS) + `@media` (CSS) | Two-layer defense is the spike-proven standard. |
| WCAG regression gate | New axe harness | Extend existing `a11y-smoke.spec.ts` | Harness already gated + wired to fixtures; NAVA11Y-03 says "the existing smoke." |

**Key insight:** Almost everything here is already proven in `routes/runes-test/nav-a11y/`. The phase's risk is NOT inventing mechanisms — it's *integrating* them with the production root layout's existing hooks and choosing correct `view-transition-name` placements.

## Component Responsibilities (the real files + exact elements to name)

| Surface (VT-02) | Real file | Element to receive `view-transition-name` | Reachable? | Notes |
|-----------------|-----------|--------------------------------------------|-----------|-------|
| **Header (chrome)** | `apps/frontend/src/routes/Header.svelte:66` | `<header class="pt-safet relative ...">` → `view-transition-name: persistent-header` | ✅ YES (every page) | Keeps chrome STABLE during transition (spike 015 §Surprises: chrome must be excluded from the root slide by giving it its own stable name). HIGH priority. |
| **MainContent (body)** | `apps/frontend/src/routes/MainContent.svelte:60` | outer `<div {...concatClass(...)}>` → `main-content` | ✅ YES (most pages) | The content wrapper that cross-fades. |
| **Hero** | `lib/components/hero/Hero.svelte:28` (and/or `HeroEmoji.svelte`) | the wrapping `<div>` → `question-hero` | ✅ YES (questions, results) | Used by both voter+candidate questions (`<Hero content={customData.hero}>`) and results (`HeroEmoji`). Consider naming at the `MainContent` `hero` snippet wrapper for uniformity, OR on Hero/HeroEmoji root. |
| **QuestionActions** | `lib/components/questions/QuestionActions.svelte:81` | the `<div role="group" ...>` → `question-actions` | ✅ YES (voter questions) | Voter `/questions` only; candidate `/questions` uses bespoke `<Button>`s in `primaryActions`, not `QuestionActions` (see §Voter vs Candidate). |
| **QuestionHeading** (99-1) | `lib/dynamic-components/questionHeading/QuestionHeading.svelte:72,89` | the `<HeadingGroup>` (`<hgroup>`) OR the inner `<h1>` → `question-heading` | ✅ YES (voter+candidate questions) | ALSO the focus target — `restProps` is spread onto `<hgroup>`, so `data-focus-on-nav` + `tabindex="-1"` can be passed as props from the page. |
| **Results election switch** (99-1) | `routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte:351` | `<AccordionSelect ... data-testid="voter-results-election-select">` | ⚠️ CONDITIONAL — only renders when `$dataRoot.elections.length > 1` | Name on the AccordionSelect wrapper. Audit: single-election seeds won't show it. |
| **Results entity tabs** (99-1) | same file, line 380 | `<Tabs ... data-testid="voter-results-entity-tabs">` | ⚠️ CONDITIONAL — only when `entityTabs.length > 1` | Switching tabs is URL-driven `goto()` → triggers `onNavigate` → animates. Name the `Tabs` root. |
| **Entity-detail tabs** (99-1) | `lib/dynamic-components/entityDetails/EntityDetails.svelte:147` | `<Tabs tabs={contentTabs} bind:activeIndex>` | ⚠️ CONDITIONAL — only when `contentTabs.length > 1` | Inside the drawer; tab switching here is LOCAL `$bindable` state (NOT a `goto`), so it does NOT trigger `onNavigate` and View Transitions won't auto-fire. **See Open Question 1.** |
| **Candidate `/questions`** (99-1) | `routes/candidate/(protected)/questions/[questionId]/+page.svelte` | hero (line 265), heading (line 273) | ✅ YES | Shares `MainContent`, `Hero`, `QuestionHeading`. Q→Q nav is `goto(submitRoute)` on save → animates. Has its own `{#key question.id}` remount (line 250). |

**Shared-component caveat:** `MainContent`, `Hero`, `HeroEmoji`, `QuestionHeading`, and `Tabs` are SHARED across many routes. Putting a `view-transition-name` directly inside these components names them on EVERY page that uses them. Since `view-transition-name` must be UNIQUE per snapshot, naming a component that appears twice on one page (e.g. two `Tabs`) will break pairing. **Prefer passing the name via `class`/`style`/`restProps` from the route-level callsite** rather than hardcoding inside the shared component, except for genuinely singleton chrome (Header, MainContent).

## VT-02 Surface Audit (99-1 expansion — reachable vs skip)

| Surface | Verdict | Rationale |
|---------|---------|-----------|
| Header / MainContent / Hero / QuestionActions (4 spike-proven) | **COVER** | Always present on the animated routes; spike-proven. |
| QuestionHeading | **COVER** | Present on both voter + candidate `/questions`; doubles as focus target. |
| Candidate `/questions` route | **COVER** | Reuses MainContent/Hero/QuestionHeading; Q→Q is a real `goto`. |
| Results election-switch (AccordionSelect) | **COVER (conditional)** | Real `goto(buildListRoute(...))` on change → `onNavigate` fires. Only visible with >1 election — document that single-election seeds skip it. |
| Results entity tabs (Tabs) | **COVER (conditional)** | `handleEntityTabChange` does `goto(buildListRoute(...))` → `onNavigate` fires. Only with >1 entity type. |
| Entity-detail tabs (Tabs inside drawer) | **AUDIT / likely SKIP or local-only** | Tab switch is LOCAL `bind:activeIndex` (`EntityDetails.svelte:147`), NOT a navigation — `onNavigate` does NOT fire, so the global VT hook won't animate it. Covering it would require a *local* `startViewTransition` call (bespoke) → arguably out-of-scope per "NOT bespoke choreography." **Recommend: document as SKIPPED unless the planner adds a small local VT wrapper; flag to user.** |

## Voter vs Candidate `/questions` (route-sharing map)

| Concern | Voter `/questions` | Candidate `/questions` | Shared? |
|---------|--------------------|-----------------------|---------|
| Route dir | `routes/(voters)/(located)/questions/` | `routes/candidate/(protected)/questions/` | **Separate** route trees |
| Leaf page | `[questionId]/+page.svelte` (no `{#key}`) | `[questionId]/+page.svelte` (`{#key question.id}` remount, line 250) | Separate files, similar shape |
| Layout | `questions/+layout.svelte` (progress + error) | `questions/+layout.svelte` (progress + required-info redirect) | Separate |
| Body shell | `MainContent` | `MainContent` | **SHARED** |
| Hero | `Hero` | `Hero` (gated by `hideHero`) | **SHARED** |
| Heading | `QuestionHeading` | `QuestionHeading` (`onShadedBg`) | **SHARED** |
| Actions | `QuestionActions` (skip/next/prev) | bespoke `<Button>`s (save/cancel/return) | **Different** |
| Nav trigger | `goto(url, {noScroll})` in `handleJump` (line 159) | `goto(submitRoute)` in `handleSubmit` (line 218) | Both real navs → both animate |

**Implication:** A `view-transition-name` placed inside the SHARED components (MainContent/Hero/QuestionHeading via callsite props) automatically covers BOTH apps. `QuestionActions` naming covers voter only; candidate's save/cancel buttons would need their own name if desired (lower priority — they're inside `MainContent`'s `primaryActions` which is already inside `main-content`).

## Focus Target (NAVA11Y-02)

- Convention: `data-focus-on-nav` + `tabindex="-1"` on the question heading; fall back to first `<h1>` if absent. `[VERIFIED: spike 016]`
- **No `data-focus-on-nav` exists in the codebase today** — this is a NEW convention to add. `[VERIFIED: codebase grep — 0 hits outside runes-test]`
- `QuestionHeading.svelte` spreads `restProps` onto its `<HeadingGroup>` (`<hgroup>`), which itself spreads onto the `<hgroup>` element. The page callsites already pass `data-testid` this way (`questions/[questionId]/+page.svelte:182`). So `data-focus-on-nav` and `tabindex="-1"` can be passed from the page callsite the same way — OR placed directly on the inner `<h1>` (`QuestionHeading.svelte:89`). Planner picks; the `<h1>` is the more conventional focus/announce target.
- The root-layout `afterNavigate` focus hook (Pattern 2) finds the target by querySelector — works for ANY route that has a `[data-focus-on-nav]` or `<h1>` (MainContent always renders an `<h1>`, `MainContent.svelte:82`). So the focus hook is global and the heading marker is the per-route hint.

## Coexistence with EXISTING root-layout hooks (CRITICAL integration constraint)

`apps/frontend/src/routes/+layout.svelte` ALREADY has navigation hooks that MUST keep working:

| Existing hook | Line | Purpose | Integration action |
|---------------|------|---------|--------------------|
| `beforeNavigate(({willUnload, to}) => ... location.href = ...)` | 154-156 | app-update full reload | LEAVE UNCHANGED. |
| `onNavigate(() => submitAllEvents())` | 157 | flush analytics events | **MERGE** — the new VT `onNavigate` must ALSO call `submitAllEvents()` (or keep both hooks; SvelteKit supports multiple `onNavigate` registrations, but verify ordering — analytics flush should not block the VT promise). Safest: one `onNavigate` that flushes THEN returns the VT promise. |
| `onDestroy(() => submitAllEvents())` | 158 | flush on unmount | LEAVE UNCHANGED. |
| `afterNavigate(({from, to}) => startPageview(...))` | 159-161 | analytics pageview | **MERGE** — add the focus-reset `rAF(focus)` logic into this existing `afterNavigate`, or register a second `afterNavigate`. Both fire; order is registration order. |

**`spike 012` `afterNavigate` note (from CONTEXT):** The objective asks to confirm the spike-012 `getRoute` `afterNavigate` republish is unrelated. **CONFIRMED:** `getRoute.svelte.ts`'s `afterNavigate` workaround is a Domain-A concern (Phase 97, CTX-08) and is being REMOVED by the rune migration. It lives in `lib/contexts/app/getRoute.svelte.ts`, not in the root layout. It does not conflict with this phase's root-layout `afterNavigate`; the two coexist (different files, both are valid simultaneous `afterNavigate` registrations). Since Domain A and Domain B run in parallel (DX-1), do NOT touch `getRoute.svelte.ts` here.

**SSR guard:** The root layout's animated content is inside an `{#if error}{:else if !ready}...{:else}{@render children()}` block (lines 207-227). The `onNavigate`/`afterNavigate` hooks run regardless (they're registered in `<script>`), and `typeof document === 'undefined'` guards SSR. The announcer, if placed in the root layout, should sit OUTSIDE the maintenance/loading branches so it's always present.

## Common Pitfalls

### Pitfall 1: Source-URL trap in onNavigate
**What goes wrong:** `?notr=1` escape hatch and destination-based decisions silently misbehave.
**Why:** `page.url` is the SOURCE url during `onNavigate`.
**Avoid:** Read `navigation.to?.url`. `[VERIFIED: spike 015]`
**Warning sign:** Transition fires (or skips) based on the page you're LEAVING.

### Pitfall 2: Svelte CSS `:global(@media)` parser rejection
**What goes wrong:** Build fails with "Expected a valid CSS identifier."
**Avoid:** `@media (...) { :global(...) }`, never `:global(@media ...)`. `[VERIFIED: spike 015]`

### Pitfall 3: focus() scroll fight
**What goes wrong:** Page jumps on Q→Q because `focus()` auto-scrolls against `goto({noScroll:true})`.
**Avoid:** `focus({ preventScroll: true })` — mandatory. `[VERIFIED: spike 016]`

### Pitfall 4: Duplicate / non-unique `view-transition-name`
**What goes wrong:** Two elements with the same `view-transition-name` visible at once → browser throws / transition breaks.
**Avoid:** Name shared components at the route callsite (unique per page), not hardcoded inside `Tabs`/`Hero` which can appear multiple times. Keep singleton chrome (Header/MainContent) named in-component.

### Pitfall 5: Clobbering analytics hooks
**What goes wrong:** Replacing the root `onNavigate`/`afterNavigate` drops `submitAllEvents` / `startPageview`.
**Avoid:** Merge logic or register additional hooks. §Coexistence.

### Pitfall 6: Entity-detail tab "transition" expectation
**What goes wrong:** Planner assumes entity-detail tab switch animates via the global hook; it doesn't (local state, no nav).
**Avoid:** Treat it as SKIP / local-VT-only and document. §VT-02 Surface Audit.

### Pitfall 7: Chrome dragged into the root slide
**What goes wrong:** Without a stable `view-transition-name` on Header, the default `::view-transition-*(root)` slides the WHOLE viewport including chrome → "whole page sliding" instead of content cross-fade.
**Avoid:** Give Header (and other persistent chrome) a stable name so it's excluded from the root group. `[VERIFIED: spike 015 §Surprises]`

## Phase 100 forward-compat (do NOT restructure here)

Phase 100 (QLAYOUT-01/02) will HOIST voter `/questions` rendering from `[questionId]/+page.svelte` into `questions/+layout.svelte` and wrap the input in `{#key question.type}`. To survive that restructure:
- **`view-transition-name`s** placed on SHARED components (`MainContent`, `Hero`, `QuestionHeading`, `QuestionActions`) move WITH those components when rendering hoists — names stay valid. Avoid names tied to the leaf-page file.
- **`data-focus-on-nav`** on `QuestionHeading` (a shared component) survives the hoist.
- The global root-layout `onNavigate`/`afterNavigate` hooks are route-agnostic — unaffected by the questions hoist.
- Name the focus target + transition surfaces on the components, not on per-route wrapper divs that Phase 100 may delete. `[ASSUMED — based on spike 014b recommendation; planner should confirm naming lives on shared components]`

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| svelte `transition:`/`crossfade` for page transitions | Native `document.startViewTransition` + `onNavigate` | SvelteKit official guide (current) | Animates reused-component DOM regeneration that svelte transitions can't reach. |
| `<title>` SPA announce | `aria-live` region | Long-standing a11y best practice | Reliable across NVDA/JAWS/VoiceOver. |

**Deprecated/outdated:** none relevant.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Naming transition surfaces on SHARED components (not leaf-page wrappers) makes them survive the Phase-100 hoist. | Phase 100 forward-compat | If wrong, Phase 100 re-touches the names — low risk, mechanical. |
| A2 | Entity-detail tab switching (local `bind:activeIndex`) won't animate via the global `onNavigate` hook and should be SKIPPED (or needs a bespoke local VT). | VT-02 Surface Audit / Pitfall 6 | If user wants it animated, planner adds a small local `startViewTransition` — slightly more scope. Flag at discuss/plan. |
| A3 | SvelteKit allows the new VT `onNavigate` and the existing analytics `onNavigate` to coexist (multiple registrations) OR they can be merged into one. | Coexistence | If multiple registrations conflict on the returned promise, must merge into one hook. Verify during implementation. |
| A4 | The generic announcer label can be derived from `page.params` without new i18n strings (D-03). | Pattern 3 | Low — D-03 explicitly permits a generic param-derived string. |

## Open Questions

1. **Entity-detail drawer tab transitions (99-1 surface).**
   - What we know: tab switch is local `bind:activeIndex` in `EntityDetails.svelte:147`, not a navigation. The global `onNavigate` VT hook will NOT fire.
   - What's unclear: whether 99-1 "where applicable" intends this to animate (requiring a bespoke per-component `startViewTransition`) or whether "not a navigation → skip" is acceptable.
   - Recommendation: **Document as SKIPPED** in the plan (it's local state, not navigation; animating it = bespoke choreography which is out-of-scope). Surface to user at plan time; cheap to add a local VT later if desired.

2. **Single vs merged `onNavigate` registration.**
   - What we know: root layout already has `onNavigate(() => submitAllEvents())`.
   - Recommendation: implement ONE `onNavigate` that calls `submitAllEvents()` then returns the VT promise, to guarantee analytics flush ordering and avoid promise-coordination ambiguity between two registrations.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| SvelteKit `$app/navigation` hooks | VT-01, NAVA11Y-02 | ✓ | in-repo SvelteKit 2 | — |
| `document.startViewTransition` | VT-01/02 | ✓ (runtime, modern browsers) | Chrome 111+/FF 144+/Safari 18+ | feature-detect → instant swap |
| `@axe-core/playwright` | NAVA11Y-03 | ✓ | in-repo `tests/` | — |
| `PLAYWRIGHT_A11Y=1` env gate | NAVA11Y-03 | ✓ (config-driven project) | — | — |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** older browsers without `startViewTransition` → instant swap (graceful, already in `shouldAnimate`).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright + `@axe-core/playwright` (E2E); Vitest (unit, not primary here) |
| Config file | `tests/playwright.config.ts` (a11y project block lines 141-152) |
| a11y project | `a11y-smoke`, `testDir: ./tests/specs/a11y`, depends on `data-setup-base` |
| Gate env var | `PLAYWRIGHT_A11Y=1` |
| Run command | `PLAYWRIGHT_A11Y=1 npx playwright test -c tests/playwright.config.ts --project=a11y-smoke` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NAVA11Y-03 | 0 axe violations across voter routes WITH transition stack active | a11y smoke | `PLAYWRIGHT_A11Y=1 ... --project=a11y-smoke` | ✅ `a11y-smoke.spec.ts` (EXTEND) |
| NAVA11Y-02 | Focus lands on heading after Q→Q nav | e2e (new assertion) | extend a11y or voter-journey spec — assert `document.activeElement` is the heading | ⚠️ Wave 0 (new assertion) |
| NAVA11Y-01 | aria-live announcer text updates on route change | e2e (new assertion) | assert `#route-announcer` textContent changes | ⚠️ Wave 0 (new assertion) |
| VT-01/02/03 | Transition fires (or skips with `?notr=1` / reduced-motion) | e2e (optional) | drive nav with/without `?notr=1`; assert via `window.__vt*` hook or no error | ⚠️ Wave 0 (optional — visual; `?notr=1` gives determinism) |

### Sampling Rate
- **Per task commit:** `yarn lint:check && yarn build` (Svelte CSS parser catches the `:global(@media)` landmine at build).
- **Per wave merge:** `PLAYWRIGHT_A11Y=1 ... --project=a11y-smoke` (the NAVA11Y-03 gate).
- **Phase gate:** a11y-smoke green + the existing voter-journey suite green (no regression vs v2.10 baseline). `?notr=1` available for deterministic e2e.

### Wave 0 Gaps
- [ ] Extend `tests/tests/specs/a11y/a11y-smoke.spec.ts` — add focus-on-nav assertion + aria-live announcer assertion (existing 0-violation gate already covers axe). Covers NAVA11Y-01/02/03.
- [ ] (Optional) Add a determinism assertion using `?notr=1` so e2e Q→Q nav doesn't depend on animation timing. The voter-journey fixtures already walk `/questions` and `/results`; `?notr=1` keeps them flake-free under the new transition layer.
- [ ] No new framework install — harness exists.

## Security Domain

> `security_enforcement` not found in config; this phase is client-side UI animation + a11y with **no** auth, input, crypto, network, or data-handling surface.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | no | — (no user input introduced) |
| V6 Cryptography | no | — |

### Known Threat Patterns for this stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| `?notr=1` reflected into navigation decision | Tampering (negligible) | Boolean read only (`=== '1'`); never reflected into DOM/HTML — no XSS surface. |

No security-sensitive surface. WCAG 2.1 AA (an accessibility, not security, gate) is the binding compliance requirement and is covered by NAVA11Y-03.

## Project Constraints (from CLAUDE.md)

- **Context Destructuring Rule (Svelte 5):** Reactive accessors (`selectedElections`, `matches`, `opinionQuestions`, etc.) MUST be read via `ctx.X` inside a tracking scope, never destructured. The results layout + question pages already follow this (`$derived(voterCtx.selectedElections)`). Any new reactive reads this phase adds must comply.
- **`svelte-warning: accepted` format:** If a vite-plugin-svelte / compiler warning is intentionally accepted, use `// svelte-warning: accepted — <rationale>` immediately above the line. (Likely needed if the `(document as any).startViewTransition` cast triggers a lint warning — the spike uses `// eslint-disable-next-line @typescript-eslint/no-explicit-any`; prefer a typed approach if SvelteKit ships VT types.)
- **WCAG 2.1 AA compliance** is mandatory (CLAUDE.md "Important Implementation Notes") — directly aligns with NAVA11Y-03.
- **TypeScript strict, avoid `any`:** prefer a typed `startViewTransition` guard over the spike's `as any` cast if types are available.
- **Localization:** D-03 explicitly avoids NEW localized strings; the generic announcer label sidesteps i18n. If a localized label is later wanted, it must go through `staticSettings.supportedLocales` / i18n.
- **No worktrees (DX-2):** single working tree, atomic commits.
- **One PR per phase (DX-3).**

## Code Examples

### Merged root-layout onNavigate (analytics + VT)
```ts
// Target: apps/frontend/src/routes/+layout.svelte (replaces the line-157 onNavigate)
// [CITED: composed from existing +layout.svelte:157 + spike nav-a11y/+layout.svelte:30-46]
onNavigate((navigation) => {
  submitAllEvents();                                  // preserve existing analytics flush
  if (!shouldAnimate(navigation.to?.url)) return;     // VT-01/03 + ?notr=1 (D-02)
  return new Promise((resolve) => {
    document.startViewTransition(async () => {
      resolve();
      await navigation.complete;
    });
  });
});
```

### Naming a shared component at the callsite (avoids duplicate-name break)
```svelte
<!-- voter questions page — name the heading + mark focus target via restProps -->
<QuestionHeading
  question={question!}
  questionBlocks={voterCtx.selectedQuestionBlocks}
  data-testid="voter-questions-heading"
  data-focus-on-nav
  tabindex="-1"
  style="view-transition-name: question-heading" />
```
*(`QuestionHeading` spreads `restProps` onto its `<hgroup>`; confirm whether `style`/`tabindex` should instead live on the inner `<h1>` for correct focus semantics — planner decides.)*

## Sources

### Primary (HIGH confidence)
- `apps/frontend/src/routes/runes-test/nav-a11y/+layout.svelte` — complete spike-016 reference impl (onNavigate, afterNavigate, announcer, reduced-motion CSS) `[VERIFIED: codebase]`
- `apps/frontend/src/routes/+layout.svelte` — real root layout + existing nav hooks `[VERIFIED: codebase]`
- `apps/frontend/src/routes/Header.svelte`, `MainContent.svelte`, `Layout.svelte` `[VERIFIED: codebase]`
- `apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte` — election-select + entity Tabs callsites `[VERIFIED: codebase]`
- `apps/frontend/src/routes/(voters)/(located)/questions/[questionId]/+page.svelte` + candidate equivalent `[VERIFIED: codebase]`
- `lib/components/questions/QuestionActions.svelte`, `lib/dynamic-components/questionHeading/QuestionHeading.svelte`, `lib/components/tabs/Tabs.svelte`, `lib/dynamic-components/entityDetails/EntityDetails.svelte` `[VERIFIED: codebase]`
- `tests/tests/specs/a11y/a11y-smoke.spec.ts` + `tests/playwright.config.ts:141-152` — a11y gate `[VERIFIED: codebase]`
- Spike READMEs 013/015/016 + `.planning/spikes/WRAP-UP-SUMMARY.md` `[VERIFIED: in-repo]`

### Secondary (MEDIUM confidence)
- SvelteKit View Transitions guide — `onNavigate`+`startViewTransition` coupling pattern `[CITED: svelte.dev/docs/kit — page-transitions]` (matches the spike impl exactly)

### Tertiary (LOW confidence)
- none

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new deps; all in-repo or browser-native, spike-verified.
- Architecture / patterns: HIGH — complete working reference scaffold exists in-tree; this is integration, not invention.
- File/component map: HIGH — every cited file + line read this session.
- VT-02 expanded-surface reachability: MEDIUM — election-select + entity-tabs are conditional (seed-dependent); entity-detail tabs are local-state (Open Question 1).
- Coexistence with existing hooks: MEDIUM — merge strategy is clear but SvelteKit multi-registration ordering should be confirmed at implementation.

**Research date:** 2026-06-04
**Valid until:** 2026-07-04 (stable — in-repo patterns + browser-native API)

## RESEARCH COMPLETE
