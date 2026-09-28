# Phase 99: Domain B Wave A — View Transitions + Navigation a11y - Pattern Map

**Mapped:** 2026-06-04
**Files analyzed:** 9 modified
**Analogs found:** 9 / 9 (one canonical analog: the spike-016 reference scaffold)

> **Lift-and-merge, not invent.** Every mechanism in this phase exists, working, at the in-tree spike scaffold `apps/frontend/src/routes/runes-test/nav-a11y/+layout.svelte` (spike 016). The job is to (a) MERGE its hooks into the real root layout's EXISTING hooks, and (b) place `view-transition-name` on the right real components at the route callsite. No new mechanism is authored.

## File Classification

| Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------|------|-----------|----------------|---------------|
| `apps/frontend/src/routes/+layout.svelte` | navigation hook host + a11y announcer + reduced-motion style | event-driven (nav) | `routes/runes-test/nav-a11y/+layout.svelte` | exact (mechanism); MERGE-into existing hooks |
| `apps/frontend/src/routes/Header.svelte` | view-transition-named surface (singleton chrome) | transform (CSS) | nav-a11y `.chrome-header` | role-match |
| `apps/frontend/src/routes/MainContent.svelte` | view-transition-named surface (singleton body) | transform (CSS) | nav-a11y `<main id="main">` | role-match |
| `apps/frontend/src/lib/components/hero/Hero.svelte` (+ `heroEmoji/HeroEmoji.svelte`) | view-transition-named surface (SHARED) | transform (CSS) | nav-a11y `question-body` name | role-match |
| `apps/frontend/src/lib/components/questions/QuestionActions.svelte` | view-transition-named surface | transform (CSS) | nav-a11y named element | role-match |
| `apps/frontend/src/lib/dynamic-components/questionHeading/QuestionHeading.svelte` | view-transition-named surface + focus target (SHARED) | transform + focus | nav-a11y `[data-focus-on-nav]`/`<h1>` | exact (focus convention) |
| `apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte` | view-transition-named surfaces at callsite (conditional) | event-driven (`goto`) | nav-a11y named elements | role-match |
| `apps/frontend/src/routes/(voters)/(located)/questions/[questionId]/+page.svelte` + candidate `routes/candidate/(protected)/questions/[questionId]/+page.svelte` | callsite naming + focus-target marker | event-driven (`goto`) | nav-a11y callsite | role-match |
| `tests/tests/specs/a11y/a11y-smoke.spec.ts` | test (a11y gate) | request-response (Playwright + axe) | existing `a11y-smoke.spec.ts` | exact (extend existing) |

## Pattern Assignments

### `apps/frontend/src/routes/+layout.svelte` (navigation hook host) — THE CRITICAL MERGE

**Analog:** `apps/frontend/src/routes/runes-test/nav-a11y/+layout.svelte`

**EXISTING hooks in the real file (lines 154-161) — MUST be preserved, NOT overwritten:**
```ts
beforeNavigate(({ willUnload, to }) => {                 // LEAVE UNCHANGED (app-update reload)
  if (updated.current && !willUnload && to?.url) location.href = to.url.href;
});
onNavigate(() => submitAllEvents());                      // MERGE — analytics flush
onDestroy(() => submitAllEvents());                       // LEAVE UNCHANGED
afterNavigate(({ from, to }) => {                         // MERGE — analytics pageview
  startPageview(to?.url?.href ?? '', from?.url?.href);
});
```

**MERGE 1 — `onNavigate` (replace line 157).** One hook: flush analytics THEN return VT promise (per Open Question 2 — single registration guarantees flush ordering, avoids two-promise ambiguity):
```ts
// composed from real +layout.svelte:157 + spike nav-a11y/+layout.svelte:22-46
function shouldAnimate(destUrl: URL | undefined): boolean {
  if (typeof document === 'undefined') return false;
  if (!document.startViewTransition) return false;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false; // VT-03 layer 1
  if (destUrl?.searchParams.get('notr') === '1') return false;                        // ?notr=1 (D-02)
  return true;
}

onNavigate((navigation) => {
  submitAllEvents();                                  // preserve existing analytics flush
  if (!shouldAnimate(navigation.to?.url)) return;     // LANDMINE: navigation.to?.url — NOT page.url
  return new Promise((resolve) => {
    document.startViewTransition(async () => {
      resolve();                                      // tells SvelteKit to apply new DOM
      await navigation.complete;                      // SvelteKit swaps DOM here
    });
  });
});
```

**MERGE 2 — `afterNavigate` (extend lines 159-161).** Add focus-reset into the EXISTING analytics `afterNavigate` (spike lines 48-67):
```ts
afterNavigate(({ from, to }) => {
  startPageview(to?.url?.href ?? '', from?.url?.href);   // preserve existing analytics pageview
  if (typeof document === 'undefined') return;
  requestAnimationFrame(() => {
    const target =
      document.querySelector<HTMLElement>('[data-focus-on-nav]') ??
      document.querySelector<HTMLElement>('h1');
    target?.focus({ preventScroll: true });             // LANDMINE: preventScroll MANDATORY
  });
});
```

**Announcer placement (NAVA11Y-01).** Place OUTSIDE the `{#if error}{:else if !ready}{:else}` maintenance/loading branches (lines 207-227) so it is always present. Derive a generic label from `page.params` (D-03 — no new i18n strings):
```svelte
<div aria-live="polite" aria-atomic="true" class="sr-only" id="route-announcer">
  {page.params.questionId ? `Question ${page.params.questionId}` : 'Questions list'}
</div>
```

**Reduced-motion `<style>` block (VT-03 layer 2)** — spike lines 163-169, verbatim:
```css
@media (prefers-reduced-motion: reduce) {
  :global(::view-transition-group(*)),
  :global(::view-transition-old(*)),
  :global(::view-transition-new(*)) {
    animation: none !important;
  }
}
```
**LANDMINE:** never `:global(@media ...)` — Svelte CSS parser rejects it ("Expected a valid CSS identifier"). `@media` wraps `:global(...)`, never the reverse.

**Note on TS:** spike uses `(document as any).startViewTransition` + eslint-disable. CLAUDE.md says avoid `any` — prefer a typed guard if SvelteKit ships VT types; else use the `// svelte-warning: accepted —` / eslint-disable convention.

---

### `apps/frontend/src/routes/Header.svelte` (singleton chrome — name IN component)

**Real element (line 66-72):** the `<header class="pt-safet relative flex max-h-fit" ...>`. Add `view-transition-name: persistent-header`. **LANDMINE (Pitfall 7):** chrome MUST get its own stable name or the default `::view-transition-*(root)` slides the whole viewport including the header instead of a content cross-fade. Singleton → safe to hardcode in-component.

### `apps/frontend/src/routes/MainContent.svelte` (singleton body — name IN component)

**Real element (line 60-61):** the outer `<div {...concatClass(restProps, 'flex flex-grow flex-col ...')}>`. Add `main-content`. Renders an `<h1>` at line 82 — this is the global focus fallback target. Singleton → safe in-component.

---

### SHARED surfaces — name at the ROUTE CALLSITE (Pitfall 4: unique-per-snapshot)

`Hero` / `HeroEmoji` / `QuestionHeading` / `Tabs` are reused across routes and can appear twice on one page. `view-transition-name` must be unique per snapshot, so **pass the name via `style`/`class`/`restProps` from the callsite**, NOT hardcoded inside the shared component.

#### `lib/components/hero/Hero.svelte` (+ `heroEmoji/HeroEmoji.svelte`)
Root wrapping `<div>` (Hero.svelte:28). Name `question-hero` — preferably applied at the `MainContent` `hero` snippet wrapper or the page callsite. Covers voter + candidate questions + results (`HeroEmoji`).

#### `lib/components/questions/QuestionActions.svelte`
The `<div role="group" ...>` (line 81) → `question-actions`. Voter `/questions` only (candidate uses bespoke `<Button>`s in `primaryActions`, already inside `main-content`).

#### `lib/dynamic-components/questionHeading/QuestionHeading.svelte` (also the FOCUS TARGET)
`restProps` spreads onto `<HeadingGroup>`/`<hgroup>` (line 72); inner `<h1>` at line 89. Pass from the page callsite (NEW convention — `data-focus-on-nav` has 0 hits outside runes-test today):
```svelte
<QuestionHeading
  question={question!}
  questionBlocks={voterCtx.selectedQuestionBlocks}
  data-testid="voter-questions-heading"
  data-focus-on-nav
  tabindex="-1"
  style="view-transition-name: question-heading" />
```
Planner decides whether `tabindex`/focus marker lives on `<hgroup>` (via restProps) or the inner `<h1>` (more conventional focus/announce target).

---

### `routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte` (CONDITIONAL surfaces)

- **Election switch (line 351):** `<AccordionSelect data-testid="voter-results-election-select">` → name `results-election-select`. Renders only when `$dataRoot.elections.length > 1`. Change does `goto(buildListRoute(...))` → `onNavigate` fires → animates. **Single-election seeds skip it — document.**
- **Entity tabs (line 380):** `<Tabs data-testid="voter-results-entity-tabs">` → name `results-entity-tabs`. Only when `entityTabs.length > 1`. `handleEntityTabChange` does `goto(...)` → animates.
- **Reactive-read compliance (CLAUDE.md):** any new reactive read added here must use `ctx.X` / `$derived(voterCtx.X)`, never destructured.

### `questions/[questionId]/+page.svelte` (voter + candidate) (callsite naming + focus marker)

- Voter nav trigger: `goto(url, {noScroll})` in `handleJump` (line ~159) — this is why `preventScroll: true` is mandatory.
- Candidate (`routes/candidate/(protected)/questions/[questionId]/+page.svelte`): `goto(submitRoute)` in `handleSubmit`; has its own `{#key question.id}` remount (line ~250); hero (line ~265) + heading (line ~273). Shares `MainContent`/`Hero`/`QuestionHeading` → callsite names cover both apps automatically.

### `tests/tests/specs/a11y/a11y-smoke.spec.ts` (EXTEND existing — do not invent harness)

**Analog:** the existing `a11y-smoke.spec.ts` itself (project `a11y-smoke`, gated `PLAYWRIGHT_A11Y=1`, depends on `data-setup-base`; config `tests/playwright.config.ts:141-152`).
Add: focus-on-nav assertion (`document.activeElement` is the heading after Q→Q), aria-live assertion (`#route-announcer` textContent changes), optional `?notr=1` determinism for the existing voter-journey Q→Q walk. Existing 0-violation axe gate already covers the bulk of NAVA11Y-03.
Run: `PLAYWRIGHT_A11Y=1 npx playwright test -c tests/playwright.config.ts --project=a11y-smoke`.

## Shared Patterns

### View Transition coupling (VT-01)
**Source:** `routes/runes-test/nav-a11y/+layout.svelte:22-46`
**Apply to:** root `+layout.svelte` only (global, all routes). `navigation.to?.url` not `page.url`.

### Focus reset (NAVA11Y-02)
**Source:** spike lines 48-67
**Apply to:** root `+layout.svelte` `afterNavigate` (global, querySelector-based); `data-focus-on-nav` marker on `QuestionHeading`. `focus({ preventScroll: true })` mandatory.

### Reduced-motion two-layer (VT-03)
**Source:** spike `shouldAnimate()` matchMedia (line 25) + `<style>` `@media` block (163-169)
**Apply to:** root layout JS short-circuit + root layout `<style>`.

### view-transition-name placement rule
**Apply to:** singleton chrome (Header, MainContent) → hardcode in-component. SHARED components (Hero, QuestionHeading, Tabs) → pass via callsite `style`/`restProps` (unique-per-snapshot).

## No Analog Found

None — the spike-016 scaffold is a complete, working, in-tree analog for every mechanism. The only non-analog work is mechanical: merging into existing hooks and selecting callsite name placements.

## Code-Level Landmines (carry into every plan)

| Landmine | Rule | Source |
|----------|------|--------|
| Source-URL trap | Use `navigation.to?.url`, never `page.url`, in `onNavigate` | spike 015 It.3 |
| Svelte CSS parser | `@media { :global(...) }`, never `:global(@media ...)` | spike 015 It.2 |
| Scroll fight | `focus({ preventScroll: true })` mandatory (2 real `goto({noScroll})` callsites) | spike 016 It.5 |
| Duplicate names | Name SHARED components at the callsite, not in-component | Pitfall 4 |
| Analytics clobber | MERGE `submitAllEvents` / `startPageview`, do not overwrite | +layout.svelte:157,159 |
| Chrome slide | Header MUST get a stable name | Pitfall 7 |
| Entity-detail tabs | Local `bind:activeIndex` (`EntityDetails.svelte:147`) — NOT a nav; global VT won't fire. SKIP / document (Open Q1) | VT-02 Audit |
| Phase 100 forward-compat | Name surfaces + focus marker on SHARED components so the questions-hoist preserves them | §Phase 100 |

## Metadata

**Analog search scope:** `apps/frontend/src/routes/`, `apps/frontend/src/lib/components|dynamic-components/`, `tests/tests/specs/a11y/`
**Files scanned/verified this session:** root `+layout.svelte` (140-229), `Header.svelte` (60-74), `MainContent.svelte` (55-89), spike `nav-a11y/+layout.svelte` (full)
**Pattern extraction date:** 2026-06-04

## PATTERN MAPPING COMPLETE
