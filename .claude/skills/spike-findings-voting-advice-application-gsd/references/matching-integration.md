# Matching Layer Integration (matchStore is Zero-Diff)

The voter matching layer is **already idiomatic Svelte 5** — `matchStore.svelte.ts`
and `nominationAndQuestionStore.svelte.ts` use `$derived.by` with getter
callbacks and zero `svelte/store` imports. The only legacy tether was the
**consumer-supplied** `AnswerStore.answers` getter, which routes through
`fromStore(...)` in production. Once the answer store migration lands (see
[[persistent-rune-stores]]), the matching layer requires **zero changes**.

## Requirements

- **No migration work** on `matchStore.svelte.ts`, `nominationAndQuestionStore.svelte.ts`,
  or `MatchingAlgorithm`. They are already correct.
- **Verify reactivity through the rune-native answer store** — a single
  `setAnswer` call must trigger `$derived.by` re-evaluation inside `matchStore`
  and re-render the matches table.
- **Persistence-rehydration interplay must work** — page reload →
  `localStorage` → `runeLocalStorage` initial value → `matchStore.value` initial
  `$derived.by` run → match scores rendered without further user input.

## How to Build It

Nothing to build. After [[persistent-rune-stores]] migrates production
`answerStore.svelte.ts`, the existing consumer wiring stays valid:

```ts
// voterContext (post-migration) — same as today, just no fromStore inside
const answers = voterAnswerStore({
  /* ... */
});

const matchSelections = matchStore({
  answers, // now rune-native getter
  nominationsAndQuestions: () => nq.value,
  algorithm,
  minAnswers: () => 1,
  calcSubmatches: () => [
    /* … */
  ],
  parentMatchingMethod: () => 'best'
});

// Template / .ts reads — unchanged
const top = $derived(matchSelections.value[electionId]?.[ENTITY_TYPE.Candidate]);
```

### Why this works structurally

`matchStore` reads `answers.answers` inside its `$derived.by` body. The
getter chain — `voterAnswers.answers → store.current → value $state` —
establishes the rune-dependency edge **at the call site inside the
`$derived.by`**, exactly where Svelte 5 needs it. No `subscribe()`,
no `fromStore`, no `Writable<T>` is required to bridge the reactivity edge —
the rune system tracks per-getter-call.

## What to Avoid

1. **Don't "modernize" `matchStore.svelte.ts`** to mirror the answer-store
   refactor. It's already correct. Reaching for a rewrite would risk
   regressing the `MaybeWrappedEntityVariant` runtime shape that the matching
   algorithm depends on.

2. **Don't destructure `voterAnswers.answers` into a local var** at the
   `matchStore` callsite or anywhere consuming match results. Same destructure
   trap as documented in CLAUDE.md — invokes the getter once, captures the
   empty initial value.

3. **Don't pass `answers.answers` (the _value_) into `matchStore`.** Pass
   `answers` (the _store object_); `matchStore` reads `.answers` per-evaluation
   inside its `$derived.by`. Passing the value snapshots it at call time and
   breaks reactivity.

## Constraints

- **`MaybeWrappedEntityVariant[]`** is the matchStore return shape — entries
  may be `Match`-wrapped (when answers exist) or raw entity arrays (when no
  answers). Runtime-check for `distance` / `score` properties to filter.
- **`Match.score`** is a 0-100 percentage getter on the Match object;
  `Match.target` is the `CandidateNomination`; `Match.target.entity` is the
  `Candidate` with `firstName`, `lastName`, `name`.
- **80 raw nominations vs. 327 candidates in the seed:** the 80 comes from
  `nominationAndQuestionStore` filtering to first election + `ENTITY_TYPE.Candidate`.
  The 327 candidates is total seeded across all elections.
- **Verified via end-to-end browser test** against the seeded `default`
  template: a single answer-button click recomputes all 80 matches and
  re-renders the top-5 table with no manual refresh.

## Origin

Synthesized from spikes: 004
Source files available in:

- `sources/004-matchstore-integration/runes-test-page.svelte` — the integration
  callsite wiring production `matchStore` + `nominationAndQuestionStore` +
  spike-003 `voterAnswerRuneStore`. The matchStore call itself is unchanged from
  production usage.
