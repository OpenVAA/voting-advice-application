# Phase 100: Domain B Wave B — Questions Layout Restructure - Research

**Researched:** 2026-06-04
**Domain:** SvelteKit 2 route restructure (unified-layout-with-empty-leaf) + Svelte 5 runes + WCAG-preserving navigation a11y
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01 (100-1):** Hoist **both rendering and the data `load`** up to `questions/+layout.ts` / `questions/+layout.svelte` (full parity with the production results pattern). `[questionId]/+page.svelte` becomes an empty stub. (QLAYOUT-01)
- **D-02:** Use **`{#key question.type}`** (NOT `{#key question.id}`): the input stays mounted across a run of same-variant questions and remounts cleanly only at Likert↔open-text↔slider boundaries; layout-owned `$state` answers survive Q→Q. (QLAYOUT-02)
- **D-03 (100-2):** Add an **explicit E2E assertion that accumulated answers survive a multi-step Q→Q run** after the restructure — **add it to the existing voter-journey spec** (not a new standalone spec). This is the exact behavior the restructure must preserve.

### Claude's Discretion
- Whether any shared sub-components are extracted during the hoist, as long as the leaf `+page.svelte` ends up an empty stub and the layout owns rendering.

### Deferred Ideas (OUT OF SCOPE)
- None recorded in CONTEXT.md for this phase. (The Wave A View-Transitions mechanism + focus/announcer landed in Phase 99 and must be PRESERVED, not re-implemented here.)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| QLAYOUT-01 | `/questions` rendering hoisted from `[questionId]/+page.svelte` into parent `questions/+layout.svelte` (unified-layout-with-empty-leaf, mirroring `results/[[electionTab]]/+layout.svelte`); leaf becomes empty stub | Architecture Patterns 1–2 (production empty-leaf proof at `results/.../+page.svelte:39-41`), Recommended Route Structure, hoist source map in Runtime State Inventory, Pitfalls 2/5 (sibling routes + import depth) |
| QLAYOUT-02 | Variant remount uses `{#key question.type}` (NOT `{#key question.id}`); input stays mounted within a same-variant run, remounts cleanly only at type boundaries; layout-owned `$state` answers survive Q→Q | Pattern 3 (`{#key question.type}` with `QUESTION_TYPE` discriminant), Anti-Patterns (forbids `{#key question.id}`), Don't Hand-Roll (answer survival), Open Question 2 (input inside / actions outside) |
</phase_requirements>

## Summary

This phase converts the voter `/questions` branch from a "page-does-the-rendering" shape to the **unified-layout-with-empty-leaf** shape that already ships in production at `results/[[electionTab]]/+layout.svelte`. Today `questions/[questionId]/+page.svelte` (the leaf) owns all rendering — `MainContent`, the hero/heading/info/input/actions snippets, the `question`/`questionBlock` derivations, and the `handleAnswer`/`handleJump` navigation handlers. After the hoist, the parent `questions/+layout.svelte` owns rendering and the leaf becomes an empty stub. Variant remounting moves to `{#key question.type}` so the input stays mounted across a run of same-`type` questions and remounts cleanly only at type boundaries (e.g. `singleChoiceOrdinal` → `boolean` → `text`).

The work is **structural, not behavioral** — the URL-driven semantics are identical before and after, which is exactly why the production results route proves the pattern (its leaf `+page.svelte` is `// Intentionally empty — layout owns both list and drawer rendering.`). The two load-bearing risks are: (1) **not regressing the Phase 99 Wave A a11y surface** — the `view-transition-name` markers (`question-hero`, `question-heading`), the `data-focus-on-nav` + `tabindex="-1"` focus target on `QuestionHeading`, and the `routeTitle` announcer registration via `MainContent` must all survive the move verbatim; and (2) **not breaking the existing `questions/+page.svelte` intro page and `questions/category/[categoryId]/+page.svelte`** which are siblings under the same layout and must keep rendering through `{@render children()}`.

The spike winner (`014b-single-page-url-keyed`, validated in `runes-test/nav-keyed-content/`) and the in-tree production results route give a byte-level blueprint. The codebase already carries an explicit comment in `voter-journey.spec.ts:212-224` documenting that SvelteKit reuses `[questionId]/+page.svelte` across param-only hops — that comment becomes load-bearing context for the new layout-keyed E2E assertion (D-03).

**Primary recommendation:** Hoist all rendering + the `+layout.ts` data load from `[questionId]/+page.svelte` into `questions/+layout.svelte`, keeping the existing `[questionId]/+page.svelte` path (do NOT introduce an optional `[[questionId]]` param — production results uses a separate intro `+page.svelte` sibling, and so must questions). Wrap only the variant-specific `OpinionQuestionInput` (+ its `QuestionActions` sibling if state-coupled) in `{#key question.type}`. Preserve every Phase 99 marker verbatim. Add the answer-survival assertion to the existing `voter-journey.spec.ts` (not a new spec).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Question rendering (hero/heading/info/input/actions) | Frontend Server (SSR) — `questions/+layout.svelte` | Browser (hydration + reactive re-derive) | Hoist target; layout persists across Q→Q so it owns the persistent render shell (mirrors results layout) |
| `question` / `questionBlock` derivation from URL | Frontend Server / Browser — layout `$derived` over `page.params.questionId` | — | URL is single source of truth; `$derived` recomputes on param change without remount (SvelteKit reuses the layout) |
| Data `load` (D-01) | Frontend Server — `questions/+layout.ts` | — | Full parity with `results/[[electionTab]]/+layout.ts`; load runs on the layout, not the leaf |
| Variant remount boundary | Browser — `{#key question.type}` | — | Keying on the variant property remounts the input only at type boundaries; reactive content updates within a run |
| Accumulated answers persistence | Browser — `voterCtx.answers` (`runeLocalStorage`) | layout-owned `$state` (free survival across Q→Q) | Answers already persist via the rune store; layout ownership means they also survive nav for free (no `{#key}` wipe) |
| Q→Q navigation (`handleJump`) | Browser — layout-owned handler calling `goto({ noScroll })` | — | Moves from leaf to layout; URL push drives the re-derive |
| Post-nav focus + route announce (Phase 99) | Root layout (`+layout.svelte`) reads `[data-focus-on-nav]` / `routeTitle` | `questions/+layout.svelte` must re-emit the markers | Phase 99 hooks live in root layout but TARGET markers rendered by the question UI — markers move with the hoisted render |

## Standard Stack

This phase introduces **no new packages**. It is a pure route-shape refactor on the existing stack.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `svelte` | 5.53.12 `[VERIFIED: node resolve]` | Runes (`$state`, `$derived`, `$derived.by`, `$effect`, `{#key}`) | Project's framework; Wave A already on runes |
| `@sveltejs/kit` | 2.55.0 `[VERIFIED: node resolve]` | Route layout/page contract, `load`, `$app/state.page`, `$app/navigation.goto` | Project's meta-framework; layout-with-empty-leaf is a first-class SvelteKit shape |
| `@openvaa/data` | workspace `[VERIFIED: codebase]` | `AnyQuestionVariant`, `QUESTION_TYPE`, `question.type` | Source of the `question.type` discriminant keyed by `{#key}` |

### Supporting (already in the current leaf — all move to the layout)
| Symbol | Source | Purpose |
|--------|--------|---------|
| `getVoterContext()` | `$lib/contexts/voter` | `answers`, `appSettings`, `dataRoot`, `getRoute`, `startEvent`, `t`, `selectedQuestionBlocks` (reactive — read via `voterCtx.X`) |
| `getLayoutContext()` | `$lib/contexts/layout` | `progress`, `video`, `topBarSettings` (already used by current `+layout.svelte`) |
| `MainContent` | `../../../MainContent.svelte` (from layout depth) | Render shell + `routeTitle` announcer registration (Phase 99 Plan 04) |
| `QuestionHeading` | `$lib/dynamic-components/questionHeading` | Carries `data-focus-on-nav` + `tabindex="-1"` + `view-transition-name: question-heading` (Phase 99) |
| `OpinionQuestionInput`, `QuestionActions`, `QuestionBasicInfo`, `QuestionExtendedInfoButton` | `$lib/components/questions` | Input (wrap in `{#key question.type}`) + actions + info |
| `Hero`, `Loading` | `$lib/components/hero`, `$lib/components/loading` | Hero figure (`view-transition-name: question-hero`) + loading fallback |

**Installation:** None. `yarn install` already satisfies all imports.

> **Import-depth caveat:** the relative import `../../../MainContent.svelte` in `[questionId]/+page.svelte` (line 37, four `../`) and in `+layout.svelte` (three `../`) differ by one directory level. When code moves from the leaf up to the layout, **every relative import must be re-pathed by one level** (`../../../../MainContent.svelte` → `../../../MainContent.svelte`). The existing `questions/+layout.svelte` already imports `MainContent` at the correct layout depth (`../../../MainContent.svelte`) — use it as the reference.

## Package Legitimacy Audit

> No external packages are installed in this phase. All symbols are workspace-internal (`@openvaa/*`) or already-present framework deps (`svelte`, `@sveltejs/kit`). Package legitimacy gate is **N/A** — nothing to audit.

## Architecture Patterns

### System Architecture Diagram

```
                 URL change  /questions/q1  →  /questions/q2   (param-only hop)
                        │
                        ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │  ROOT +layout.svelte  (Phase 99 Wave A — PERSISTS, do not touch)  │
   │   • onNavigate → startViewTransition (wraps the DOM swap)         │
   │   • afterNavigate → rAF focus([data-focus-on-nav]) preventScroll  │
   │   • #route-announcer aria-live=polite ← routeTitle.current        │
   └─────────────────────────────────────────────────────────────────┘
                        │  (layout chain unchanged for param-only hop —
                        │   SvelteKit REUSES the questions layout instance)
                        ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │  questions/+layout.ts   (NEW: hoisted data load — D-01)          │
   │      load() → returns data the layout render needs                │
   └─────────────────────────────────────────────────────────────────┘
                        │
                        ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │  questions/+layout.svelte   (HOIST TARGET — owns rendering)       │
   │   questionId = $derived(page.params.questionId)   (per-field)     │
   │   question   = $derived.by(... selectedQuestionBlocks ...)        │
   │   questionBlock, side-effects ($effect: progress/video/redirect)  │
   │   handleAnswer / handleJump / handleDelete  (moved from leaf)     │
   │                                                                   │
   │   IF route is a question (questionId present):                    │
   │     <MainContent title={...}>   ← registers routeTitle (Ph99)     │
   │        hero figure  [view-transition-name: question-hero]         │
   │        QuestionHeading [data-focus-on-nav][tabindex=-1]           │
   │                        [view-transition-name: question-heading]   │
   │        {#key question.type}        ← QLAYOUT-02 boundary          │
   │           <OpinionQuestionInput/>  (remounts only at type change) │
   │        {/key}                                                     │
   │        <QuestionActions/>                                         │
   │     </MainContent>                                                │
   │   ELSE (intro / category child):  {@render children()}            │
   └─────────────────────────────────────────────────────────────────┘
                        │                              │
          ┌─────────────┘                              └──────────────┐
          ▼                                                            ▼
  questions/[questionId]/+page.svelte            questions/+page.svelte (intro)
  (NOW EMPTY STUB — QLAYOUT-01)                  questions/category/[categoryId]/+page.svelte
  // layout owns rendering                       (UNCHANGED — render via children())
```

The diagram's primary use case (Q→Q hop): URL changes → root layout wraps the swap in a View Transition → SvelteKit reuses the questions layout (no remount) → `questionId` `$derived` recomputes → `question`/`questionBlock` recompute → content nodes re-render inside the persistent shell → `{#key question.type}` remounts the input only if `type` changed → `afterNavigate` refocuses `[data-focus-on-nav]` → announcer speaks the new `routeTitle`.

### Recommended Route Structure (after hoist)
```
(voters)/(located)/questions/
├── +layout.ts            # NEW — hoisted data load (D-01, parity with results/+layout.ts)
├── +layout.svelte        # HOIST TARGET — owns question rendering + handlers + {#key question.type}
│                         #   (still also renders the intro/category children via {@render children()})
├── +page.svelte          # UNCHANGED — questions intro (category selection / min-answers gate)
├── [questionId]/
│   └── +page.svelte      # NOW EMPTY STUB (QLAYOUT-01)
└── category/[categoryId]/
    └── +page.svelte      # UNCHANGED — category intro
```

### Pattern 1: Unified-layout-with-empty-leaf (the production results shape)
**What:** The layout `$derived`s its active object from `page.params`, renders the full UI, and the leaf `+page.svelte` is empty.
**When to use:** When the leaf is reused across param-only URL changes and you want the render + state to live on the persistent layout instance.
**Production reference (verbatim leaf):**
```svelte
<!-- results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/+page.svelte -->
<!-- Source: apps/frontend/.../results/.../+page.svelte:39-41 [VERIFIED: codebase] -->
<script lang="ts">
  // Intentionally empty — layout owns both list and drawer rendering.
</script>
```
**Apply to questions leaf:**
```svelte
<!-- (voters)/(located)/questions/[questionId]/+page.svelte (after) -->
<!-- Empty leaf — rendering is owned by the parent layout (014b / results shape). -->
<script lang="ts">
  // Intentionally empty — questions/+layout.svelte owns question rendering.
</script>
```

### Pattern 2: Per-field `page` reads + `$derived.by` for the active question
**What:** Derive `questionId` as a fine-grained `page.params.questionId` read (NOT `$derived(page).params.questionId`), then resolve the question.
**Why:** CONVENTIONS §9 / Spike 012 proxy-reference trap — reading `page` as a single value inside a tracking scope short-circuits reactivity.
**Example (carried from the current leaf, lines 59-71):**
```svelte
<!-- Source: current [questionId]/+page.svelte:59-71 [VERIFIED: codebase] -->
let question = $derived.by<AnyQuestionVariant | undefined>(() => {
  const questionId = parseParams(page).questionId;     // parseParams reads page.params.questionId per-field
  if (!questionId) error(500, 'No questionId provided.');
  try {
    return questionId === FIRST_QUESTION_ID
      ? voterCtx.selectedQuestionBlocks.blocks[0]?.[0]
      : $dataRoot.getQuestion(questionId);
  } catch {
    error(404, `Question with id ${questionId} not found.`);
  }
});
let questionBlock = $derived(question ? voterCtx.selectedQuestionBlocks.getByQuestion(question) : undefined);
```
> Note: the current leaf already uses `$derived.by` + `parseParams(page)` (which reads `page.params` per-field) — this is correct and moves up unchanged.

### Pattern 3: `{#key question.type}` variant boundary (QLAYOUT-02)
**What:** Wrap ONLY the variant-specific input in `{#key question.type}`.
**Why:** `question.type` is the discriminant (`singleChoiceOrdinal`, `boolean`, `text`, `number`, `date`, `singleChoiceCategorical`, `multipleChoiceCategorical`, `image`, `multipleText` — see `QUESTION_TYPE` `[VERIFIED: codebase packages/data/.../questionTypes.ts]`). Keying on `type` keeps the input mounted across a run of same-type questions and remounts cleanly only at a type boundary. Mirrors production `{#key }${activeElectionId}:${activeEntityType}``` at `results/.../+layout.svelte:400`.
```svelte
<!-- Source: spike 014b runes-test/nav-keyed-content + RESEARCH synthesis [CITED: spike 014b] -->
{#key question.type}
  <OpinionQuestionInput
    question={question!}
    answer={answers.answers[question!.id]}
    onChange={handleAnswer}
    data-testid="voter-questions-input" />
{/key}
```
> **`OpinionQuestionInput` reactivity note** `[VERIFIED: codebase]`: its doc-comment declares `question`/`answer` as "Not reactive" props. That is precisely why a `{#key}` boundary is needed for a clean variant swap — but because the existing leaf renders fine across Q→Q today (the page is reused and `question`/`answer` props ARE re-passed reactively on each `$derived` recompute), the planner must verify whether the input needs to be inside or outside the `{#key}`. **Recommendation: input INSIDE `{#key question.type}`; `QuestionActions` may stay OUTSIDE unless it carries variant-specific `$state`** (it currently does not — it is driven by props).

### Anti-Patterns to Avoid
- **`{#key question.id}` or `{#key questionId}`** — forces a remount on EVERY hop, wipes input `$state`, defeats Svelte's component reuse. Locked decision D-02 forbids this. `[CITED: spike 014b / page-navigation-and-transitions.md]`
- **Introducing an optional `[[questionId]]` param** — the spike used `[[questionId]]` because it had no separate intro page. Production questions has a real `questions/+page.svelte` intro AND `category/[categoryId]/+page.svelte`. Keep `[questionId]` (required) so those siblings keep their own routes. The layout renders the question UI when on a `[questionId]` route and `{@render children()}` otherwise.
- **Reading `page` as a single value in a tracking scope** — use `page.params.questionId` per-field (Spike 012 trap).
- **Dropping `noScroll: true` from `handleJump`'s `goto`** — fights the Phase 99 `focus({ preventScroll: true })` and produces scroll jitter.
- **Moving `onMount` logic verbatim** — the leaf's `onMount` (`start` query-param handling, lines 97-105) fires on FIRST mount only. Because the layout persists across Q→Q, `onMount` will NOT re-fire per question. Audit whether `start`-param handling must become an `$effect(() => page.params.questionId)` or `afterNavigate` hook (see Pitfall 4).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Persistent layout across param hops | Manual `{#key}`-everything remount or a custom store snapshot | SvelteKit's native layout reuse (the empty-leaf shape) | SvelteKit already reuses `+page.svelte`/layouts across param-only hops (Spike 014a: ~36% element survival measured in production) |
| Variant-scoped remount | An `$effect` that manually tears down/rebuilds the input | `{#key question.type}` | Svelte's `{#key}` is the idiomatic remount primitive; production results route already uses it |
| Answer survival across nav | A bespoke "save before navigate" hook | layout-owned `$state` + existing `voterCtx.answers` (`runeLocalStorage`) | Answers already persist; layout ownership gives free Q→Q survival (the exact behavior D-03 asserts) |
| Post-nav focus / route announce | A new focus/announce mechanism in the questions layout | Phase 99 root-layout hooks + the `[data-focus-on-nav]` / `routeTitle` markers | Already shipped in Wave A; this phase only re-emits the markers from the new render location |

**Key insight:** The entire value of this phase is *deleting* code (collapsing the leaf to a stub) and *moving* code (leaf → layout), not adding mechanism. Every behavior already exists somewhere in the tree; the risk is regression, not greenfield correctness.

## Runtime State Inventory

> This is a route-shape refactor (code-only). No datastore/service/OS state is renamed. Inventory included for completeness because code MOVES between files.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — `voterCtx.answers` keys are `question.id` and are unchanged by the hoist. Verified: `answers.setAnswer(question.id, value)` semantics identical pre/post. | None — code edit only |
| Live service config | None — no external service references the route file paths. | None |
| OS-registered state | None | None — verified by route-only scope |
| Secrets/env vars | None | None |
| Build artifacts | `.svelte-kit/` generated types (`./$types`) regenerate on build; the new `+layout.ts` produces a `LayoutLoad` type. Stale `.svelte-kit` could mis-type the moved `load`. | Run `yarn build` (frontend) after the move; `yarn dev:clean` if Vite serves stale SSR (MEMORY: HMR staleness) |

**Code that physically moves files (audit each for broken relative imports / lost lifecycle):**
- All of `[questionId]/+page.svelte`'s `<script>` (contexts, `question`/`questionBlock` derivations, `$effect` side-effects, `onMount` start-param handler, `handleAnswer`/`handleJump`/`handleDelete`, `disabled` `$state`) → `+layout.svelte`.
- All of `[questionId]/+page.svelte`'s markup (`MainContent` + hero/heading/info/primaryActions snippets) → `+layout.svelte`, gated on "is this a `[questionId]` route".
- `import MainContent from '../../../../MainContent.svelte'` → re-path to `../../../MainContent.svelte` (one level shallower at the layout).

## Common Pitfalls

### Pitfall 1: Regressing the Phase 99 Wave A a11y/transition surface
**What goes wrong:** The `view-transition-name: question-hero` (leaf line 171), `view-transition-name: question-heading` + `data-focus-on-nav` + `tabindex="-1"` on `QuestionHeading` (leaf lines 178-185) get dropped or renamed during the move, silently breaking the cross-fade and the WCAG focus reset.
**Why it happens:** They look like incidental attributes; a "clean rewrite" of the markup omits them.
**How to avoid:** Move the snippets verbatim. Add a grep acceptance gate: the new `+layout.svelte` must contain `data-focus-on-nav`, `tabindex="-1"`, `view-transition-name: question-hero`, `view-transition-name: question-heading`. The `MainContent` `title` prop must still be passed (it feeds the Phase 99 `routeTitle` announcer registration).
**Warning signs:** `a11y-smoke.spec.ts` announcer/focus assertions fail; cross-fade visibly stops; axe finds a focus-order violation.

### Pitfall 2: Breaking the intro / category sibling routes
**What goes wrong:** Replacing `{@render children?.()}` in the layout with the unconditional question UI breaks `/questions` (intro) and `/questions/category/[categoryId]`.
**Why it happens:** Misreading the spike (which had NO intro sibling and used an optional `[[questionId]]`).
**How to avoid:** The layout must branch: render the question UI **only when on a `[questionId]` route** (e.g. `question && questionBlock` truthy, which is exactly the current leaf's `{#if question && questionBlock}` guard) and `{@render children?.()}` otherwise so the intro/category `+page.svelte` files still render. The current layout's existing `{#if voterCtx.opinionQuestions.length > 0}{@render children?.()}{:else}...error...{/if}` envelope must be preserved as the outer shell.
**Warning signs:** Intro page renders blank; category intro 404s or double-renders.

### Pitfall 3: `onMount` no longer fires per question (lifecycle drift)
**What goes wrong:** The leaf's `onMount` (handles `?start=` query param — sets `firstQuestionId`, fires `question_startFrom` event) runs once per leaf mount. After the hoist the layout persists, so `onMount` fires once for the whole questions session, not per question.
**Why it happens:** The page-reuse fact (Spike 014a) means mount-time logic must migrate to a nav-aware hook.
**How to avoid:** Convert the `?start=` handler to `afterNavigate` or `$effect(() => { page.params.questionId; ... })`. **However** — note the leaf already today reuses across hops, so `onMount` already only fires once; verify current behavior first (it may already be correct because `start` is only ever present on the entry URL). Document the decision either way.
**Warning signs:** `question_startFrom` analytics event missing/duplicated; `firstQuestionId` not set on a deep-link with `?start=`.

### Pitfall 4: `$effect` redirect loop on `questionBlock` miss
**What goes wrong:** The leaf's `$effect` (lines 74-91) calls `goto($getRoute('Questions'))` when `questionBlock` is undefined. In the persistent layout this `$effect` re-runs on every `questionId` change; a transient undefined during a hop could trigger a spurious redirect.
**Why it happens:** `$effect` timing in a persistent component differs from a remounting one.
**How to avoid:** Keep the `$effect` guard logic but verify it only redirects on a genuine miss (question exists in dataRoot but not in `selectedQuestionBlocks`), not on a transient `$derived` recompute. The existing guard already distinguishes `if (!questionBlock) { if (question) {...redirect...} }` — preserve that two-level check.
**Warning signs:** Navigation bounces back to `/questions`; `effect_update_depth_exceeded`.

### Pitfall 5: Relative-import depth off-by-one after the move
**What goes wrong:** `../../../../MainContent.svelte` (correct from the leaf) becomes wrong from the layout (which is one level shallower).
**How to avoid:** Re-path every relative import. The existing `+layout.svelte` already imports `MainContent` at `../../../MainContent.svelte` — match it. `yarn build` catches these.
**Warning signs:** Vite "failed to resolve import"; build exits 1.

## Code Examples

### The current leaf's full render block (the thing being hoisted)
See `apps/frontend/src/routes/(voters)/(located)/questions/[questionId]/+page.svelte:164-239` `[VERIFIED: codebase]` — `{#if question && questionBlock}` → `<MainContent title={text}>` with `hero` / `heading` / `primaryActions` snippets and the inline info block; `{:else}<Loading/>`. This entire block moves into the layout's question branch.

### Production proof of the empty leaf
See `apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/+page.svelte:39-41` `[VERIFIED: codebase]` — empty `<script>` with the "layout owns rendering" comment.

### Production proof of `{#key}` variant boundary
See `apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte:400` `[VERIFIED: codebase]` — `{#key }${activeElectionId}:${activeEntityType}`{`}` remounts `EntityListWithControls` only at scope-tuple change, identical mechanism to `{#key question.type}`.

### Spike 014b validated layout
See `apps/frontend/src/routes/runes-test/nav-keyed-content/questions/+layout.svelte` `[VERIFIED: codebase]` — the winning shape: layout does all rendering, `questionId = $derived(page.params.questionId)`, `{#key questionId}` toggled vs no-key, layout-owned `let answers = $state({})` surviving nav. (Spike used `{#key questionId}` for the A/B demo; production uses `{#key question.type}` per D-02.)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Leaf `+page.svelte` owns question rendering | Layout owns rendering, leaf is empty stub | This phase (Phase 100) | Cleaner reads; render + state on the persistent instance |
| `{#key question.id}` style full remount (never shipped in questions, but the naive default) | `{#key question.type}` variant-scoped remount | This phase | Input survives same-type runs; remounts only at type boundaries |
| `<svelte:head><title>` for SR route announce | `aria-live="polite"` `#route-announcer` ← `routeTitle` | Phase 99 (already shipped) | Universal AT support; this phase must not regress |

**Deprecated/outdated:** Nothing deprecated. The `runes-test/nav-*` routes are spike scaffolding (not production) and should NOT be edited by this phase.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `QuestionActions` carries no variant-specific `$state` and can stay OUTSIDE `{#key question.type}` | Pattern 3 | If it holds variant state, it must move inside the `{#key}` — low risk, easy to verify by reading the component |
| A2 | The `?start=` `onMount` handler already only fires once today (leaf is reused) so the hoist does not change its behavior | Pitfall 3 | If `onMount` currently DOES re-fire (it should not, given page reuse), the start-param logic needs an `afterNavigate` port |
| A3 | `questions/+layout.ts` does not yet exist and D-01 creates it new (no current `+layout.ts` under questions) | Standard Stack / structure | If a load already exists it must be merged, not overwritten — verify before writing |
| A4 | What the hoisted `load` should return is parity-with-results "mostly empty `{}`" since data flows through `voterCtx`, not page data | Architecture | If the leaf relied on page-data load, the new `+layout.ts` must replicate it |

> A3/A4 should be confirmed at plan time by `ls questions/` (no `+layout.ts` seen in this research — `[VERIFIED: codebase]` only `+layout.svelte`, `+page.svelte`, `[questionId]/`, `category/` exist) and by reading `results/[[electionTab]]/+layout.ts` (returns `{}` after guards — `[VERIFIED: codebase]`).

## Open Questions

1. **Does the hoisted `load` need to do anything, or return `{}`?**
   - What we know: results' `+layout.ts` returns `{}` after redirect guards; all question data flows through `voterCtx` (client contexts), not `load` page data.
   - What's unclear: whether D-01 ("hoist the data load") implies adding real load logic or just creating the parity file.
   - Recommendation: Create `questions/+layout.ts` mirroring results (guard/return-`{}` shape). If there is no server guard needed for questions, the `load` may simply be a stub establishing the parity pattern. Plan should confirm with the locked D-01 intent.

2. **Input INSIDE vs `QuestionActions` OUTSIDE the `{#key}`?**
   - What we know: D-02 mandates `{#key question.type}` wrapping the variant input; `QuestionActions` is prop-driven.
   - What's unclear: whether the answer-button `disabled` `$state` (which lives in the script, not in `QuestionActions`) interacts with the `{#key}` boundary.
   - Recommendation: `disabled` `$state` stays in the layout script (outside any `{#key}`), input inside `{#key}`, actions outside. This preserves `disabled` across a variant remount.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node / yarn | build + dev | ✓ (project standard) | — | — |
| Local Supabase | E2E voter-journey seed | ✓ (`yarn db:*`) | — | — |
| Playwright | voter-journey + a11y-smoke E2E gates | ✓ (`yarn test:e2e`) | — | — |

No new external dependencies. Skip-condition partially applies (route-only change) but E2E infra is the regression gate, so it is listed.

## Validation Architecture

> `workflow.nyquist_validation` is not set to `false` in config.json → section included.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (unit) + Playwright (E2E), Svelte 5 |
| Config file | `apps/frontend` vitest config; `tests/` Playwright project (`voter-journey`, `a11y-smoke`) |
| Quick run command | `cd apps/frontend && yarn build` (catches import/parse/`{#key}` errors fastest) |
| Full suite command | `yarn db:reset && yarn db:seed --template e2e/base --likert-only && yarn dev` then `yarn test:e2e --project=voter-journey` + `PLAYWRIGHT_A11Y=1 yarn test:e2e --project=a11y-smoke` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| QLAYOUT-01 | Rendering hoisted to `+layout.svelte`; `[questionId]/+page.svelte` is empty stub | source + build | `grep -c "MainContent" questions/+layout.svelte` >0 AND `[questionId]/+page.svelte` has empty `<script>` body; `cd apps/frontend && yarn build` exits 0 | ✅ (grep/build) |
| QLAYOUT-01 | Intro + category siblings still render | E2E | `yarn test:e2e --project=voter-journey` (intro category-list + min-answers gate step at spec line ~488) | ✅ voter-journey.spec.ts |
| QLAYOUT-02 | `{#key question.type}` present; NOT `{#key question.id}` / `{#key questionId}` | source | `grep -F '{#key question.type}' questions/+layout.svelte` matches AND `grep -E '\{#key (question\.id\|questionId)\}'` returns nothing | ✅ (grep) |
| QLAYOUT-02 / D-03 | Accumulated answers survive a multi-step Q→Q run | E2E | **NEW assertion in** `voter-journey.spec.ts` — after answering N questions, navigate back/forward and assert prior answers remain set (e.g. answered option still `toBeChecked`) | ❌ Wave 0 (assertion to add) |
| NAVA11Y (Phase 99 regression) | focus + announcer survive the restructure | E2E | `PLAYWRIGHT_A11Y=1 yarn test:e2e --project=a11y-smoke` (announcer = localized title, axe 0 violations, focus reset) | ✅ a11y-smoke.spec.ts |
| Phase 99 markers preserved | view-transition-names + focus marker re-emitted | source | `grep -E 'data-focus-on-nav\|tabindex="-1"\|view-transition-name: question-hero\|view-transition-name: question-heading' questions/+layout.svelte` all present | ✅ (grep) |

### Sampling Rate
- **Per task commit:** `cd apps/frontend && yarn build` (sub-10s incremental; catches structural errors) + targeted `grep` acceptance gates.
- **Per wave merge:** `yarn test:e2e --project=voter-journey` (functional + new answer-survival assertion).
- **Phase gate:** voter-journey green AND `PLAYWRIGHT_A11Y=1 ... --project=a11y-smoke` green (Phase 99 regression gate) before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] Add the answer-survival assertion to `tests/tests/specs/voter/voter-journey.spec.ts` (D-03 — explicit multi-step Q→Q answer-survival check; reuse `expectQuestionAndAdvance` helper + a back-navigation step asserting a previously answered option stays checked). NOT a new spec file.
- [ ] (Verify, not create) `questions/+layout.ts` does not already exist before the new file is written (A3).

*Existing test infrastructure (voter-journey + a11y-smoke) covers all regression surfaces; the only net-new test artifact is the D-03 answer-survival assertion appended to the existing voter-journey spec.*

## Security Domain

> `security_enforcement` not explicitly `false` in config; included for completeness.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Voter `/questions` is unauthenticated public flow |
| V3 Session Management | no | No session change; answer persistence is client-side `localStorage` (unchanged) |
| V4 Access Control | no | No access-control surface touched |
| V5 Input Validation | no (no NEW input) | Answer values already validated by `@openvaa/data` question variants; this phase moves rendering, not validation |
| V6 Cryptography | no | None |

### Known Threat Patterns for SvelteKit voter route
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| `questionId` path-param injection → arbitrary `getQuestion` | Tampering | Existing `try/catch` → `error(404)` on unknown id (preserved verbatim from leaf lines 62-68) |
| XSS via question text | Tampering | Question text rendered through existing `Term`/`HeadingGroup` components + `sanitizeHtml` where HTML is interpolated (unchanged) |

No new attack surface — the route inputs (`page.params.questionId`) and their validation are unchanged; only the file that renders them moves.

## Project Constraints (from CLAUDE.md)

- **Context Destructuring Rule** — `selectedQuestionBlocks`, `opinionQuestions`, `answersLocked`, etc. are REACTIVE accessors: read via `voterCtx.X` (never destructure). Stable refs (`t`, `getRoute`, `appSettings`, `dataRoot`, `answers`, `startEvent`) may be destructured. The hoisted code already follows this (leaf destructures stables, reads `voterCtx.selectedQuestionBlocks` directly) — preserve it.
- **Per-field `page` reads** — `$derived(page.params.questionId)`, never `$derived(page).params.X`.
- **No `any`** — TypeScript strict; the `LayoutLoad` type for the new `+layout.ts` must be typed (`import type { LayoutLoad } from './$types'`), mirroring results' `eslint-disable func-style` const-form annotation.
- **WCAG 2.1 AA** — focus + announcer + reduced-motion (Phase 99) must remain green.
- **Localization** — all user-facing strings via `t(...)` (unchanged; moved verbatim).
- **`svelte-warning: accepted` / `// reason:`** comment conventions if any framework warning is intentionally accepted.
- **Code Review Checklist** — `.agents/code-review-checklist.md` applies.

## Sources

### Primary (HIGH confidence)
- `[VERIFIED: codebase]` `apps/frontend/src/routes/(voters)/(located)/questions/[questionId]/+page.svelte` — the hoist source (full current render + handlers)
- `[VERIFIED: codebase]` `apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte` — current layout (outer envelope to preserve)
- `[VERIFIED: codebase]` `apps/frontend/src/routes/(voters)/(located)/questions/+page.svelte` + `category/[categoryId]/+page.svelte` — sibling routes that must keep rendering
- `[VERIFIED: codebase]` `apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte` + `+layout.ts` + leaf `+page.svelte` — production unified-layout-with-empty-leaf reference (incl. `{#key}` at line 400, empty leaf, `load` returning `{}`)
- `[VERIFIED: codebase]` `apps/frontend/src/routes/runes-test/nav-keyed-content/questions/+layout.svelte` + leaf — spike 014b validated shape
- `[VERIFIED: codebase]` `packages/data/src/objects/questions/base/questionTypes.ts` — `QUESTION_TYPE` discriminant values
- `[VERIFIED: codebase]` `apps/frontend/src/lib/dynamic-components/questionHeading/QuestionHeading.svelte` — Phase 99 focus/VT marker host
- `[VERIFIED: codebase]` `tests/tests/specs/voter/voter-journey.spec.ts:212-224` — documents `+page.svelte` reuse; D-03 assertion target
- `[CITED: Skill spike-findings .../references/page-navigation-and-transitions.md]` — Wave B blueprint (B.1–B.5)
- `[VERIFIED: node resolve]` svelte 5.53.12, @sveltejs/kit 2.55.0
- `99-01-SUMMARY.md` / `99-04-SUMMARY.md` — Phase 99 Wave A surfaces (VT helper, focus reset, `routeTitle` announcer) that must not regress

### Secondary (MEDIUM confidence)
- `100-CONTEXT.md` locked decisions D-01/D-02/D-03 + Claude's discretion (sub-component extraction)
- `.planning/REQUIREMENTS.md` QLAYOUT-01/QLAYOUT-02 text

### Tertiary (LOW confidence)
- None — all claims grounded in in-tree code or locked decisions.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new deps; versions verified by node resolve
- Architecture: HIGH — production analog (`results/`) and validated spike (`014b`) both in-tree, byte-level reference
- Pitfalls: HIGH — each pitfall traced to a specific in-tree line (focus markers, intro siblings, `onMount`, `$effect` redirect, import depth)
- Validation: HIGH — existing voter-journey + a11y-smoke specs are the gates; only one new assertion needed

**Research date:** 2026-06-04
**Valid until:** 2026-07-04 (stable — route-shape refactor on a fixed framework version; spike findings are durable)
