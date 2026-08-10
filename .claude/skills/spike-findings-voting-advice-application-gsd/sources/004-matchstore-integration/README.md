---
spike: 004
name: matchstore-integration
type: standard
validates: "Given the production matchStore.svelte.ts (already fully rune-native — uses $derived.by + getter callbacks, zero svelte/store imports) and the new rune-native voterAnswerRuneStore from Spike 003, when a voter changes an answer for an opinion question, then matchStore's $derived.by re-evaluates the entire match tree and downstream consumers re-render — proving the rune-native answer store is a 1:1 reactive replacement for the legacy store-bridged AnswerStore"
verdict: VALIDATED
related: [003]
tags: [svelte5, runes, matching, voter, integration]
---

# Spike 004 — matchStore Integration with Rune-Native AnswerStore

## What This Validates

**Spike type pivot:** when scouting `matchStore.svelte.ts` for the planned
rewrite, the discovery was that the production file is **already fully
idiomatic Svelte 5**:

```ts
// apps/frontend/src/lib/contexts/voter/matchStore.svelte.ts
export function matchStore({ answers, nominationsAndQuestions, algorithm, ... }) {
  const _value = $derived.by(() => {
    const currentAnswers = answers.answers;
    const nq = nominationsAndQuestions();
    ...
  });
  return { get value() { return _value; } };
}
```

Zero `svelte/store` imports. Pure runes. Getter-based exports. The only thing
tying `matchStore` to legacy infrastructure was its dependency on
`AnswerStore.answers` getter — which routes through `fromStore(...)` in
production. Once Spike 003 lands, that dependency is rune-native.

This spike is therefore an **integration validation** — does matchStore
actually work end-to-end against the new rune-native voterAnswerStore?

## Implementation

Wires production `matchStore` and `nominationAndQuestionStore` against
the new rune-native infrastructure in
`apps/frontend/src/routes/runes-test/+page.svelte`:

- DataRoot populated via Spike 002 controls (the seeded Finnish demo)
- `voterAnswerRuneStore` from Spike 003 supplies answers
- `nominationAndQuestionStore` filters to first election + Candidate type
- `MatchingAlgorithm` (Manhattan + RelativeMaximum) as in production
- `matchStore` consumes all of the above

No production code modified; integration uses production functions imported
directly into the spike route.

## How to Run

```bash
yarn db:start
# /runes-test
# 1. Click Spike 002 buttons 1, 2, 3 to load DataRoot
# 2. In Spike 004 panel, click answer buttons (1-5) for each opinion question
# 3. Observe Top-5 candidate matches re-rank in real time
```

## Results

**Verdict:** VALIDATED ✓ — matchStore is **zero-diff migration-ready**.

Browser verification on 2026-05-21:

| State                                  | Top-5 score range                                         |
| -------------------------------------- | --------------------------------------------------------- |
| 3 persisted answers (q1=1, q2=5, q3=3) | 75% – 67%                                                 |
| Same answers + q2 changed 5 → 1        | **100% – 92%** (completely re-ranked)                     |
| All answers cleared                    | matches=80 (raw nominations, no scores), top-5 list empty |

**Key findings:**

- matchStore's `$derived.by` correctly tracks `voterAnswerRuneStore.answers`
  through the rune-native getter chain. **A single answer button click triggers
  full re-computation of all 80 candidate matches AND re-renders the top-5
  table — no manual refresh, no $effect plumbing needed.**
- The rune-native getter chain (`voterAnswers.answers` → `store.current` →
  `value` $state) establishes the dependency edge at the call site inside
  matchStore's `$derived.by`. Svelte 5's per-call tracking does the rest.
- Production matchStore needs **zero changes** for migration. Only its
  consumers (which today get `answers` from the production AnswerStore) will
  change when AnswerStore migrates.
- Persistence-rehydration interplay verified: page reload → localStorage
  → voterAnswerRuneStore initial state → matchStore initial $derived.by run
  → match scores rendered without further user input.

**Signal for the real migration:**

- `matchStore.svelte.ts` requires NO migration work.
- `nominationAndQuestionStore.svelte.ts` (also scouted) is similarly
  rune-native — uses `$derived.by` with getter callbacks. No migration work.
- The full voter matching layer is already idiomatic Svelte 5 — the only
  legacy code is in the AnswerStore (Spike 003 handles it) and the
  context wiring (`voterContext.svelte.ts` reads `appSettingsState.current`
  etc. — those are CLAUDE.md-documented rune-native patterns already).
