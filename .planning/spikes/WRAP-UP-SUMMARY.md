# Spike Wrap-Up Summary

**Latest wrap-up:** 2026-05-25 (added spikes 013–016 — page navigation, View Transitions, a11y)
**Spikes processed:** 17 total (001–016, all VALIDATED — 014 is comparison pair 014a + 014b)
**Feature areas:** Reactive Contexts, Persistent Rune Stores, Matching Integration, Layout Overlay Registry, Context Orchestration, Consumer Migration Codemod, Migration Inventory & Order, **Page Navigation & Transitions**
**Skill output:** `./.claude/skills/spike-findings-voting-advice-application-gsd/`
**Conventions:** `.planning/spikes/CONVENTIONS.md`

## Processed Spikes

| #   | Name                                | Type     | Verdict   | Feature Area              |
|-----|-------------------------------------|----------|-----------|---------------------------|
| 001 | appsettings-native-rune             | standard | VALIDATED | Reactive Contexts         |
| 002 | dataroot-native-rune                | standard | VALIDATED | Reactive Contexts         |
| 003 | voter-answer-store-rune             | standard | VALIDATED | Persistent Rune Stores    |
| 004 | matchstore-integration              | standard | VALIDATED | Matching Integration      |
| 005 | candidate-answer-store-rune         | standard | VALIDATED | Persistent Rune Stores    |
| 006 | layout-overlay-rune                 | standard | VALIDATED | Layout Overlay Registry   |
| 007 | context-orchestration-end-to-end    | standard | VALIDATED | Context Orchestration     |
| 008 | ssr-hydration-runes                 | standard | VALIDATED | Reactive Contexts (SSR)   |
| 009 | store-codemod-feasibility           | standard | VALIDATED | Consumer Migration Codemod|
| 010 | adjacent-store-bridges              | standard | VALIDATED | Migration Inventory & Order|
| 011 | hmr-rune-contexts                   | standard | VALIDATED | Context Orchestration (DX)|
| 012 | getroute-rune                       | standard | VALIDATED | Reactive Contexts (Pattern 3)|
| 013 | nav-mount-forensics                 | standard   | VALIDATED | Page Navigation & Transitions |
| 014a| nested-layout-promotion             | comparison | VALIDATED (with reframe) | Page Navigation & Transitions |
| 014b| single-page-url-keyed               | comparison | WINNER    | Page Navigation & Transitions |
| 015 | view-transitions-api                | standard   | VALIDATED | Page Navigation & Transitions |
| 016 | focus-and-a11y-during-transitions   | standard   | VALIDATED | Page Navigation & Transitions |

## Key Findings — Session 1 (001–006)

### The frontend's reactive layer is already ~80% idiomatic Svelte 5

The remaining ~20% is concentrated in three surfaces, all proven migratable
without paradigm changes:
- `appContext` (Spike 001): drop `toStore()` wrapper, expose `get current()`.
- `dataContext` (Spike 002): drop `writable(dataRoot)` bridge AND
  `get(dataRootStore)` workaround; expose split `{ current, instance }` handles.
- `answerStore` + `candidateUserDataStore` (Spikes 003, 005): drop
  `localStorageWritable + fromStore` bridge in favor of a single
  `runeLocalStorage<T>` helper.

### Matching layer needs zero migration (Spike 004)

`matchStore.svelte.ts` and `nominationAndQuestionStore.svelte.ts` are already
fully rune-native. Spike 004 was a pivot from "rewrite matchStore" to "verify
matchStore works against the new rune-native answer store" — and it does, with
no code changes needed. A single answer-button click recomputes all 80 matches
and re-renders the top-5 table reactively.

### `untrack()` around write-after-read is a CONVENTIONS-level invariant

Discovered in Spike 002 (dataRoot producer), re-encountered in Spike 006
(overlay registry first verification attempt). Any rune-wrapped collection
mutated by an `$effect`-scoped helper that reads-then-writes the same `$state`
triggers `effect_update_depth_exceeded` AND silently breaks the global effect
scheduler — preventing subsequent components' `$effect`s from firing. The fix
is identical in both cases: wrap the read-side in `untrack()`.

### `StackedState` retires entirely (Spike 006)

The token-keyed overlay registry replaces both `StackedState.svelte.ts`
(`Readable<T>` shim + `toStore()` + LIFO index revert) AND the
`getLayoutContext(onDestroy)` consumer pattern. The new `use*()` API is
declarative — no `onDestroy` plumbing — and structurally robust against
out-of-order mount/unmount.

## Key Findings — Session 2 (007–011)

### Production has a real SSR gap in appSettings (Spike 008)

`apps/frontend/src/lib/contexts/app/appContext.svelte.ts:74-100` merges the
DB-override from `page.data.appSettingsData` inside an `$effect`. `$effect`
does NOT run during SSR, so the server-rendered HTML reflects only
`staticSettings ∪ dynamicSettings` — the DB override is missing. After
hydration, `$effect` fires, merges, and re-renders. On slow connections this
produces a visible "default → DB-override" flash. **Fix**: synchronous
`page.data` read at `$state` init; `$effect` only handles navigation. Same
fix applies to `appCustomizationData` at lines 110-118.

### Production `mergeAppSettings` is mutative (Spike 008 bonus)

`apps/frontend/src/lib/utils/settings.ts:12-20` uses
`Object.assign(target, nonNull)` which mutates the shared `staticSettings`
reference. Masked in production today because only one appContext
initializes per session — but the signature implies purity. Switch to
`{ ...target, ...nonNull }` as part of the migration.

### The destructure trap reproduces identically in rune-native contexts (Spike 007)

CLAUDE.md "Context Destructuring Rule (Svelte 5)" (Phase 61 production fix)
applies UNCHANGED to migrated voter/candidate contexts. Spike 007 built a
scoped `voterRuneContext` exposing 4 reactive accessors and verified:
canonical consumer (`$derived(ctx.X)`) updates correctly through every
mutation; destructure-trap consumer (`const { X } = ctx`) stays frozen at
init-time values forever. Migration is paradigm-preserving — no new rules
needed.

### Consumer migration is automated (Spike 009)

Pure-Node codemod (no dependencies, lives at
`apps/frontend/scripts/spike-009-store-codemod.mjs`) rewrites all 146
`$store.X` template auto-subscribe sites across 45 files in ~1 hour of
automated work. Two passes: (1) regex rewrite of `$<store>.X` →
`<store>.current.X` with negative-lookbehind guards against false positives;
(2) destructure-trap audit pass using CLAUDE.md's documented reactive-accessor
list. **Surfaces a real production bug** in
`AdminNav.svelte:33` (destructure of `isAuthenticated` defined as
`$derived(!!page.data.session)`) and a related **spread-of-context
anti-pattern** in `adminContext.svelte.ts:97` that de-reactivates the auth
context's `$derived` accessors.

### Migration order is 4-wave (Spike 010)

`apps/frontend/src/lib/contexts/**` has 18 files importing from
`svelte/store`. Spikes 001-006 cover ~7 of them; Spike 010 enumerates the
remaining ~11 by Tier 1 (leaf) / Tier 2 (secondary bridges) / Tier 3 (type
files). Migration order:

- **Wave 1** (parallel) — Tier 1 leaf contexts: appContext, dataContext,
  answerStore, candidateUserDataStore, settingsOverlay+layoutContext,
  popupStore.
- **Wave 2** — Add `runeSessionStorage` sibling of `runeLocalStorage`,
  then survey + tracking + voterContext + candidateContext (consume Tier 1
  outputs).
- **Wave 3** — getRoute migration (own custom workaround documented in
  file header — careful), run consumer-migration-codemod on 179 .svelte
  files.
- **Wave 4** (cleanup) — Delete persistedState.svelte.ts + StackedState.svelte.ts;
  drop `Readable<T>` from .type.ts files; fix AdminNav + adminContext
  spread; optional ESLint rule.

### popupStore migration is the secondary-bridge representative (Spike 010)

Generalizes [[reactive-contexts]] Pattern 1 (value-replace context) to
push/shift queue stores. Drop `toStore`, expose `get current()`, ~5-line
diff. Browser-verified push/shift/current sequence with consumer
auto-subscribe replaced by `popupQueue.current` in
`routes/+layout.svelte:69+230`.

### HMR DX is non-degraded but masks the destructure trap (Spike 011)

Vite HMR on rune-context edits triggers standard Svelte component remount.
`$state` resets; `runeLocalStorage`-backed state survives via rehydration on
construction; class-instance singletons (DataRoot) survive via parent-layout
context. Zero `effect_update_depth_exceeded` warnings, zero hydration
mismatches when `untrack()` discipline is followed.

**DX risk**: the destructure-trap consumer re-captures at remount with
*current* values, masking the trap during HMR-driven manual testing. Until
the next mutation, the trap appears fixed — then quietly goes stale.
**Mitigation**: run the Spike 009 codemod audit pass as part of pre-commit
or CI; don't rely on HMR observation to validate destructure-trap absence.

## Key Findings — Spike 012 follow-on (getRoute Wave 3 unblocker)

### `getRoute` migration shape resolved — Wave 3 no longer "careful"

Spike 010's inventory tagged `apps/frontend/src/lib/contexts/app/getRoute.svelte.ts`
as Tier 2 / Wave 3 "careful" because its file header documents a Svelte 5
`toStore` short-circuit trap on the long-lived `$app/state.page` proxy.
Spike 012 built a side-by-side 4-variant comparison and proved:

- **Approach C** (`$derived.by` over per-field reads of `page.params` /
  `page.route` / `page.url`) is the migration shape. Fine-grained per-field
  tracking bypasses the `toStore` trap by construction — never reads
  `page` as a whole value, so the render_effect short-circuit on
  reference equality doesn't apply.
- **Approach D** (`$derived.by` + `afterNavigate` defensive version bump)
  was the open question at briefing time. It matched Approach C on every
  observed step including query-param-only nav — **structurally
  redundant**. Production migration drops `afterNavigate` entirely.
- Multi-step browser-verified: 6 nav transitions across pathname,
  query-string, and back; `D.navCount = 6`; zero `effect_update_depth_exceeded`;
  zero hydration mismatches; `C ≡ B` on every row.

This is captured as **[[reactive-contexts]] Pattern 3** — joining the
Pattern 1 (value-replace) and Pattern 2 (mutation-in-place singleton)
shapes already established for appSettings and dataRoot.

### New CONVENTIONS entry: read reference-stable `$state` proxies field-by-field

`CONVENTIONS.md` Pattern 9 generalizes the Spike 012 finding: any
`$state` proxy whose object reference is stable but whose internal fields
mutate (the canonical example is `$app/state.page`) must be read
**per-field inside the tracking scope**, never as a whole value. The
trap appears via `toStore`'s `render_effect.set` short-circuit AND via
captured-handle `$derived` shapes; per-field reads avoid both.

### `afterNavigate` is paradigm-removable

Production today uses `afterNavigate(() => store.set(buildFn()))` as an
imperative republish to dodge the trap. The rune-native migration drops
both the `afterNavigate` callback AND the `writable<RouteBuilder>` store.
Net diff: ~10 LOC removed, one new `$derived.by` block, signature change
from `Readable<RouteBuilder>` to `{ readonly current: RouteBuilder }`.

## Verified Constraints for the Real Migration

- DataRoot's `Updatable.subscribe()` is a **domain abstraction** (transactional
  mutation batching across nested provides). Keep it intact; bridge to runes via
  the version counter.
- `mergeSettings()` is **associative** — required for the layout overlay
  registry approach to match the LIFO stack's merge result.
- `$state` proxies are **not structurally cloneable** — keep
  `JSON.parse(JSON.stringify(...))` defensive clones in voter answer store.
- The production `appContext` **reference-equality guard** at lines 93-100 is
  load-bearing (SvelteKit returns the same loader payload across navigations
  with matching loader inputs) — preserved in the spike.
- The production `mergeAppSettings` is mutative — **fix as part of the
  migration** (Spike 008).
- The `runeSessionStorage` sibling of `runeLocalStorage` is a **new
  addition required for Wave 2** (`voterContext.firstQuestionId`).
- `app/getRoute.svelte.ts` has its **own documented workaround** in its
  file header (lines 18-30). Wave 3 migration follows [[reactive-contexts]]
  Pattern 3 (Spike 012); `afterNavigate` is NOT needed in the new shape.

## Where to Go Next

1. **Plan the 4-wave migration** per [[migration-inventory-and-order]]:
   Wave 1 leaf contexts in parallel (6 independent PRs); Wave 2 Tier 2
   bridges; Wave 3 codemod-driven consumer migration; Wave 4 cleanup
   deletes.
2. **Fix AdminNav + adminContext spread BEFORE the codemod runs** — they're
   independent production bugs that the codemod's destructure-trap audit
   pass surfaces.
3. **Add the `runeSessionStorage` helper** alongside `runeLocalStorage`
   before Wave 2 starts.
4. **Consider graduating the codemod into a custom svelte-eslint rule**
   in Wave 4 for ongoing protection against destructure traps and `$store.X`
   regressions.

## Key Findings — Session 3 (013–016)

### The user's "no components reused" premise was partially wrong

User reported that Q→Q navigation felt like a full page redraw. Spike 013
mirrored the production tree under `/runes-test/nav-forensics/` and
established baseline mount/destroy behavior via a `mountLedger`
(`trackMount(name) → { instanceId }` writing to a module-scoped `$state`
ring buffer + DOM `data-mount-id` attributes for devtools-level identity
checks).

**Layouts persist as expected:**
- `QuestionsLayout` stays mounted across Q1→Q2→Q3 (zero events in
  the captured window between two layout-boundary destroys).
- `ResultsParentLayout` + `ResultsElectionLayout` persist across
  optional-param `[[electionTab]]/[[entityTab]]` changes.
- `KeyedEntityList` remounts on each `(electionTab, entityTab)` tuple
  change — confirms the production `{#key activeElectionId:activeEntityType}`
  block at `results/[[electionTab]]/+layout.svelte:398`.

**`+page.svelte` instances reuse across param-only URL changes.**
Spike 014a iteration 2 captured this empirically: DOM `data-mount-id`
for `[questionId]/+page.svelte` stays identical across Q1→Q2 navigation.
Spike 014a iteration 3 confirmed on the actual production voter app: 9/25
(~36%) tracked content elements survive a Q→Q hop; 64% are freshly
generated by reactive prop propagation inside the persistent component
shell.

### The fix is View Transitions, not structural refactor

Spike 015 wired `onNavigate(navigation => Promise(startViewTransition))`
on a 014b-shaped route tree with per-element `view-transition-name`
assignments. Three navigations → three transitions of 300–320ms each.
`?notr=1` escape hatch works. `prefers-reduced-motion` honored on both
JS and CSS layers.

**Critical gotcha caught:** the destination URL must come from
`navigation.to?.url`, not `page.url` — `page.url` reflects the SOURCE
URL during `onNavigate`. Caught when the `?notr=1` escape hatch test
unexpectedly animated a Q?notr → Q (no notr) transition.

**Svelte CSS parser gotcha:** `:global(@media ...)` is rejected with
"Expected a valid CSS identifier". Write
`@media ... { :global(...) }` instead — `@media` wraps the selector.

### 014a vs 014b is a code-organization choice, not a behavior choice

Both 014a (hoist chrome up to layout, keep `+page.svelte` for body) and
014b (unified layout owns everything, empty leaf `+page.svelte`) achieve
identical mount stability — because `+page.svelte` reuse already
happens for param-only changes. The choice is which shape reads better.

**Recommendation: 014b**, because it matches the existing production
`results/[[electionTab]]/+layout.svelte` pattern — consistency with what
the codebase already does.

Within 014b, **`{#key question.type}` (NOT `{#key question.id}`)** is the
right level of force-remount: keys on the variant property (Likert vs
open-text vs slider), so questions of the same shape reuse the input
while variant boundaries cleanly remount.

### WCAG 2.1 AA gate passes (Spike 016)

Stacking 014b + 015 + explicit focus/announce hooks, captured event
sequence for a Q1→Q2 navigation:

```
onNavigate-start  → vt-callback-start (+11ms) → afterNavigate (+14ms) →
vt-callback-end (+14ms) → focus-applied → H1 (+23ms) → vt-finished (+272ms)
```

Focus lands ~23ms after click, during the last ~250ms of the animation
— reads as deliberate. `aria-live="polite"` announcer derived from
`page.params.questionId` beats `<svelte:head><title>` for SR
cross-browser support. `preventScroll: true` is mandatory on the focus
call to avoid fighting `goto({ noScroll: true })`.

### Implementation plan (independent from rune migration)

Ships in two 1-day waves:

- **Wave A (1d):** View Transitions + aria-live announcer + focus-on-nav
  + reduced-motion. Standalone improvement, no structural change.
- **Wave B (1d):** Adopt 014b shape for `/questions` — hoist all rendering
  from `[questionId]/+page.svelte` into parent `questions/+layout.svelte`;
  child page becomes empty stub; `{#key question.type}` wraps the input.

The two waves are independent — Wave A can ship first for immediate UX
improvement; Wave B is a follow-up clarity refactor.
