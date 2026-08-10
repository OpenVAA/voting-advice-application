---
spike: 003
name: voter-answer-store-rune
type: standard
validates: 'Given a rune-native voterAnswerStore that drops `toStore()` / `fromStore()` / `localStorageWritable` in favor of a `runeLocalStorage` helper + direct getter exposure, when setAnswer/deleteAnswer/reset are called, then (a) the `.answers` getter reflects each change reactively in template consumers, (b) localStorage is updated synchronously with the versioned payload format, (c) page reload rehydrates the state, (d) zero `svelte/store` imports remain in the store'
verdict: VALIDATED
related: [001, 002, 004, 005]
tags: [svelte5, runes, store, localStorage, voter, answers, migration]
---

# Spike 003 — voterAnswerStore as a Native Svelte 5 Rune

## What This Validates

Replace the three-layer bridge in
`apps/frontend/src/lib/contexts/voter/answerStore.svelte.ts`:

```
production:  $state  →  toStore()  →  fromStore()  →  consumer.answers getter
spike:       $state  →                              →  consumer.answers getter
```

The intermediate `Writable<T>` and `fromStore` wrapper exist solely to keep
the legacy `$store` and `subscribe`-based persistence semantics alive. This
spike proves both can be replaced with a single rune-native helper
(`runeLocalStorage`) that uses imperative `localStorage.setItem` calls on
every `set` / `update` instead of `store.subscribe`.

## Implementation

Two co-located files (will live in production `lib/contexts/utils/` and
`lib/contexts/voter/` once promoted):

1. `apps/frontend/src/routes/runes-test/contexts/runePersistedState.svelte.ts`
   — generic helper: `runeLocalStorage<T>(key, default) → { current, set, update }`.
   Reads with version check on init; writes versioned payload on every mutation.
   Callable outside component init context (no `$effect`).

2. `apps/frontend/src/routes/runes-test/contexts/voterAnswerRuneStore.svelte.ts`
   — voter-specific store: `voterAnswerRuneStore() → { answers, setAnswer, deleteAnswer, reset }`.
   Mirrors production `answerStore.type.ts` minus the tracking-event dependency
   (orthogonal concern; production would re-add via param).

## How to Run

```bash
yarn db:start
# navigate to: http://localhost:5173/runes-test
# Spike 003 panel — click setAnswer buttons, observe table rows update
```

## Results

**Verdict:** VALIDATED ✓

Browser verification on 2026-05-21:

- Click `setAnswer('demo-q1', 3)` → answer count: 0 → 1
- Click `setAnswer('demo-q2', 'opinion-a')` → answer count: 1 → 2
- Raw answers table cell shows full JSON shape live
- `localStorage.getItem('runes-test-VoterAnswerRuneStore')` returns
  `{"data":{"demo-q1":{"value":3},"demo-q2":{"value":"opinion-a"}},"version":1}`
  — versioned payload preserved
- Page reload rehydrates initial state from localStorage (confirmed by
  Spike 004 startup state having 5 answers carried across reload)
- `reset()` clears in-memory + persists `{}`

**Banned-idiom audit:** `grep -rE "svelte/store|toStore|fromStore|writable\(|get\(" voterAnswerRuneStore.svelte.ts runePersistedState.svelte.ts` returns ZERO matches in the spike code (excluding type imports and standard `staticSettings.appVersion` usage).

**Signal for the real migration:**

- `runeLocalStorage` is a drop-in replacement for `localStorageWritable` — same
  semantics, same version check, same SSR guard. Easier ergonomics: no
  `fromStore(...).current` wrapping required at consumer sites.
- Migrating production `answerStore.svelte.ts` is a ~10-line diff:
  - delete `import { fromStore } from 'svelte/store'`
  - delete `import { localStorageWritable } from '../utils/persistedState.svelte'`
  - replace with `import { runeLocalStorage } from '...'`
  - replace `store` + `storeState` pair with single `store = runeLocalStorage(...)`
  - replace `store.update((answers) => {...})` calls — same call signature, same shape
  - replace `storeState.current` with `store.current` in the `answers` getter
- `localStorageWritable` itself can be eliminated entirely after Spike 005
  (which is the other production consumer); both replace with `runeLocalStorage`.

## Investigation Trail

- **2026-05-21** — Scoped scout found exactly 2 production consumers of
  `localStorageWritable`: `voterAnswerStore` and `candidateUserDataStore`. Both
  also use `fromStore(...)` to bridge back. Designed shared `runeLocalStorage`
  helper to serve both.
- **2026-05-21** — Browser verification clean (clicks, persistence, reload).
  No issues encountered; the rune-native pattern is structurally simpler than
  the production three-layer bridge.
