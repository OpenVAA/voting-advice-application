---
spike: 007
name: context-orchestration-end-to-end
type: standard
validates: "Given a rune-native voterContext factory exposing reactive accessors (selectedElections, opinionQuestions, matchesCount, profileComplete) as getters, when consumers either (a) read via ctx.X / $derived(ctx.X) or (b) destructure via const { X } = ctx, then (a) reactive accessors update on every dependency change AND propagate through the appContext → dataContext → voterContext cascade, (b) destructure-on-init consumers visibly fail (capturing init-time values, never updating) — proving the destructure trap reproduces in the rune-native version in the same shape as production, so the codemod can mechanically find it"
verdict: VALIDATED
related: [001, 002, 003, 004]
tags: [svelte5, runes, context, voter, candidate, orchestration, destructure-trap]
---

# Spike 007 — Context Orchestration End-to-End

## What This Validates

The first 6 spikes tested each rune piece in isolation. This spike combines
them into the **production orchestration shape**:

```
appContext (Spike 001) ──→ dataContext (Spike 002) ──→ voterContext (Spike 007)
                                                            │
                                                            ├── selectedElections ($state)
                                                            ├── opinionQuestions ($derived)
                                                            ├── matchesCount ($derived)
                                                            └── profileComplete ($derived)
```

The factory exposes 4 reactive accessors as getters — mirroring production
`voterContext.svelte.ts:412-472` shape (18+ getters). Two consumer components
test the documented **destructure trap** (CLAUDE.md → Context Destructuring
Rule, Phase 61 production fix):

- **CanonicalConsumer** — `const ctx = getCtx(); const x = $derived(ctx.X);` — should track correctly.
- **DestructureTrapConsumer** — `const { X } = getCtx();` — should capture init-time values and never update.

If both consumers diverge visually under the same state mutations, the trap is
locally observable and the codemod can find it; if they don't diverge, the
trap has changed shape (would require new rules for callers).

## Implementation

`apps/frontend/src/routes/runes-test/voter-context-orchestration/`:

1. **`voterRuneContext.svelte.ts`** — scoped voterContext factory:
   - `selectedElections` — `$state<Array<Election>>([])`
   - `opinionQuestions` — `$derived.by` over `(selectedElections, dataRoot.current.questions)`, filters by `type === 'singleChoiceOrdinal'`
   - `matchesCount` — `$derived.by` over `(voterAnswers, dataRoot.current.candidates)`, returns candidates.length iff any answers
   - `profileComplete` — `$derived(Object.keys(voterAnswers.answers).length > 0)`
   - Mutators: `selectElection(election)`, `setDemoAnswers()`
   - Pulls `dataRoot` from Spike 002 `getDataRootRuneContext()`
   - Instantiates `voterAnswerRuneStore` from Spike 003 internally

2. **`CanonicalConsumer.svelte`** — reads via `ctx.X` direct + `$derived(ctx.X)` alias

3. **`DestructureTrapConsumer.svelte`** — `const { X } = getCtx()` anti-pattern

4. **`+layout.svelte`** — initializes voterRuneContext (parent layout already
   inits appSettings + dataRoot rune contexts)

5. **`+page.svelte`** — mounts both consumers side-by-side with buttons:
   "Load DataRoot", "Select first election", "Set 3 demo answers",
   "Deselect election", "Clear answers"

## How to Run

```bash
yarn db:start
# /runes-test/voter-context-orchestration
# 1. Click "Load DataRoot" (loads elections+constituencies+questions+nominations
#    from seeded default template)
# 2. Click "Select first election"
# 3. Click "Set 3 demo answers"
# Observe canonical (green panel) vs destructure-trap (red panel) divergence
```

## What to Expect

Visible divergence in 4 independent reactive accessors after step 3:

| Accessor                    | Canonical | Trap | Verdict |
|-----------------------------|-----------|------|---------|
| selectedElections.length    | 1         | 0    | trap stale ✓ |
| opinionQuestions.length     | 18        | 0    | trap stale ✓ |
| matchesCount                | 327       | 0    | trap stale ✓ |
| profileComplete             | true      | false| trap stale ✓ |
| template direct (ctx.X)     | 1         | n/a  | live ✓ |

## Investigation Trail

- **2026-05-22** — Built scoped voterRuneContext factory + two consumer
  components. Initial filter for opinionQuestions used `q.matchable === true`
  which returned 0 (the @openvaa/data convention is a `matchable` getter
  defined per-subclass, not a plain property). Changed to
  `q.type === 'singleChoiceOrdinal'` matching the seeded default template's
  Likert-scale opinion questions. Now returns 18 matchable opinion questions.
- **2026-05-22 browser verification** — Full sequence (load → select → answer)
  drives all 4 reactive accessors. Canonical consumer updates correctly on
  every step; destructure-trap consumer stays frozen at init values across
  every step. After "Deselect" + "Clear answers", canonical reverts to zeros
  while trap (already-frozen at zeros) shows no visible change. Console clean
  — no `effect_update_depth_exceeded` warnings, no SSR errors, no orphaned
  $effects.

## Results

**Verdict:** VALIDATED ✓

**Browser verification on 2026-05-22 at /runes-test/voter-context-orchestration
against the seeded default template (327 candidates / 1 election / 24
questions):**

| Step | Canonical state                                                           | Trap state               |
|------|---------------------------------------------------------------------------|--------------------------|
| init | 0/0/0/false                                                               | 0/0/0/false              |
| load | 0/0/0/false (no selection yet)                                            | 0/0/0/false              |
| select first election | **1/18/0/false** (opinionQuestions and selectedElections live) | 0/0/0/false (stale)      |
| set 3 demo answers | **1/18/327/true** (full cascade — matchesCount + profileComplete propagate via voterAnswers → matchesCount $derived) | 0/0/0/false (still stale) |
| deselect + clear | 0/0/0/false (canonical reverts) | 0/0/0/false (always stale) |

**Key findings:**

- The destructure trap **reproduces identically** in the rune-native version.
  Captured `selectedElections` at init = `[]`, captured `matchesCount` at init
  = `0`, captured `profileComplete` at init = `false` — these locals never
  update because they're not getter calls inside a tracking scope.
- The trap is **paradigm-preserving** — the migration plan can rely on the
  CLAUDE.md Context Destructuring Rule unchanged. No new rules needed for
  rune-native consumers vs current production consumers.
- The trap is **locally observable** — every reactive accessor that's
  destructured produces a static local that's structurally distinguishable
  via AST analysis. The codemod (Spike 009) can find every callsite by
  looking for `const { X, Y, ... } = get*Context()` patterns where any of
  X/Y are documented reactive accessors.
- The **full cascade works end-to-end**: `appContext.staticSettings + dynamicSettings`
  → init → `dataContext.provide*` → drives → `voterContext.selectedElections`
  via mutator → drives → `voterContext.opinionQuestions ($derived)` → in
  parallel voterAnswers mutations drive `matchesCount + profileComplete`.
  No `effect_update_depth_exceeded`, no orphaned $effects, no manual refresh
  needed.
- Console clean for the full session — confirms no SSR issues during the
  client-side hydration of the route, no effect-scheduler breakage, no
  `untrack()`-missing loops.

**Signal for the real migration:**

1. **Migration plan can target the destructure trap explicitly.** The codemod
   (Spike 009) or lint rule should scan for `const { X } = get*Context()`
   patterns where X is in the reactive-accessor list documented in CLAUDE.md.

2. **voterContext + candidateContext migrations are mechanical.** The factory
   shape used here matches production's. The 18+ getters in production
   `voterContext.svelte.ts` + `candidateContext.svelte.ts` migrate by:
   - Drop `import { fromStore } from 'svelte/store'`
   - Drop `const appSettingsState = fromStore(appSettings)` →
     replace with `const appSettings = getAppSettingsContext()` (Spike 001)
   - Drop `const localeState = fromStore(locale)` → replaced once Spike 010
     migrates the locale store
   - Drop `firstQuestionIdState = fromStore(sessionStorageWritable(...))` →
     replace with `runeLocalStorage` or analogous session helper

3. **The "destructure trap" doctrine becomes formalized.** The
   spike-findings skill's [[reactive-contexts]] reference already documents
   this; the production CLAUDE.md citation reinforces it. After migration,
   add a lint rule (or codemod) to prevent regressions.

## Source Files

- `apps/frontend/src/routes/runes-test/voter-context-orchestration/voterRuneContext.svelte.ts`
- `apps/frontend/src/routes/runes-test/voter-context-orchestration/CanonicalConsumer.svelte`
- `apps/frontend/src/routes/runes-test/voter-context-orchestration/DestructureTrapConsumer.svelte`
- `apps/frontend/src/routes/runes-test/voter-context-orchestration/+layout.svelte`
- `apps/frontend/src/routes/runes-test/voter-context-orchestration/+page.svelte`
