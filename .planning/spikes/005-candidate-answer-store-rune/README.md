---
spike: 005
name: candidate-answer-store-rune
type: standard
validates: "Given a rune-native rewrite of the edited-answer persistence layer of candidateUserDataStore — dropping `localStorageWritable + fromStore` in favor of `runeLocalStorage` — when an unsaved edit is applied via setAnswer, then (a) the composite $derived.by current = saved + edited still re-evaluates correctly, (b) `hasUnsaved` and `unsavedIds` derivations track the edited-state, (c) localStorage persists the edited overlay with the version wrapper, (d) the candidateUserDataStore's other rune mechanisms ($state, $effect on answersLocked, $derived) are unaffected"
verdict: VALIDATED
related: [003]
tags: [svelte5, runes, store, candidate, answers, migration]
---

# Spike 005 — candidateUserDataStore: Edited-Answer Layer Rune Rewrite

## What This Validates

The production `candidateUserDataStore.svelte.ts` is a 251-line file that is
**~95% already idiomatic Svelte 5** — it uses `$state`, `$effect`, `$derived.by`,
and getter exports. The ONLY legacy bits are:

```ts
// candidateUserDataStore.svelte.ts
import { fromStore } from 'svelte/store';                              // line 2
import { localStorageWritable } from '../utils/persistedState.svelte'; // line 3

const _editedAnswersStore = localStorageWritable(KEY, {} as LocalizedAnswers); // 38
const editedAnswersState = fromStore(_editedAnswersStore);                      // 42

// reads
const editedAnswers = editedAnswersState.current;                      // 57, 97
// writes
_editedAnswersStore.update(...);                                       // 130, 138
_editedAnswersStore.set({});                                           // 144
```

These 7 lines route through a `Writable<T> → fromStore` bridge purely to
expose `$state`-backed localStorage persistence to consumers. The spike
replaces them with the same `runeLocalStorage` helper from Spike 003,
demonstrating that the composite `$derived.by` (which merges saved-state with
edited-overlay) continues to work identically.

Out of scope: `reloadCandidateData()` and `save()` — these are auth-bound
DB operations whose Svelte-store usage is already zero. The spike does not
need a live candidate session.

## Implementation

`apps/frontend/src/routes/runes-test/contexts/candidateAnswerRuneStore.svelte.ts`
— a scoped reimplementation focused on the answer-edit layer:

- `saved` = `$state<SavedCandidate | undefined>(undefined)`
- `edited` = `runeLocalStorage<EditedAnswers>(key, {})`
- `current` = `$derived.by(() => { merge saved.answers with edited.current })`
- `unsavedIds` = `$derived(Object.keys(edited.current))`
- `hasUnsaved` = `$derived(unsavedIds.length > 0)`
- Methods: `init`, `setAnswer`, `resetAnswer`, `resetAll`, `reset`

Type shapes are simplified (`SavedCandidate`, `AnswerValue`) for spike
clarity; production migration would re-use the full `CandidateUserData<true>`,
`LocalizedAnswers`, `LocalizedAnswer` types verbatim.

## How to Run

```bash
yarn db:start
# /runes-test
# Spike 005 panel:
# 1. Click "init(mock saved data)" — composite shows mock candidate
# 2. Click "setAnswer('q-mock-1', edited)" — composite shows override merged in,
#    hasUnsaved becomes true, unsavedIds includes 'q-mock-1'
# 3. Click "setAnswer('q-mock-3', new)" — composite gains a new answer key,
#    unsavedIds extends
# 4. Inspect localStorage — versioned edited overlay should be present
```

## Results

**Verdict:** VALIDATED ✓ — production migration is a ~7-line surgical diff.

Browser verification on 2026-05-21:

| Step | Composite `current.answers`                                          | hasUnsaved | unsavedIds            |
|------|----------------------------------------------------------------------|-----------|------------------------|
| init | `{q-mock-1: pre-saved A, q-mock-2: 42}`                              | false     | `[]`                   |
| edit q-mock-1 | `{q-mock-1: EDITED override, q-mock-2: 42}`                 | true      | `["q-mock-1"]`         |
| add q-mock-3  | `{q-mock-1: EDITED override, q-mock-2: 42, q-mock-3: new}`  | true      | `["q-mock-1","q-mock-3"]` |

localStorage payload after edits:
```json
{
  "data": {
    "q-mock-1": { "value": "EDITED override" },
    "q-mock-3": { "value": "new answer" }
  },
  "version": 1
}
```

**Key findings:**

- The composite `$derived.by` merging saved + edited works identically with
  the rune-native edited store. Each merge sees a fresh edited.current value
  on every mutation (rune $state dependency tracking).
- Composite reactivity tested end-to-end: edits to either side (saved via
  init, edited via setAnswer/resetAnswer) propagate to consumers' template
  reads in a single render cycle.
- The "edited overlay persists; saved data lives in $state only" boundary is
  preserved — page reload would restore edited overlay (via runeLocalStorage)
  but require re-`init()` for saved data, matching production semantics.

**Signal for the real migration:**

- Mechanical diff to `candidateUserDataStore.svelte.ts`:
  ```diff
  - import { fromStore } from 'svelte/store';
  - import { localStorageWritable } from '../utils/persistedState.svelte';
  + import { runeLocalStorage } from '../utils/runePersistedState.svelte';

  - const _editedAnswersStore = localStorageWritable(KEY, ...);
  - const editedAnswersState = fromStore(_editedAnswersStore);
  + const editedAnswers = runeLocalStorage<LocalizedAnswers>(KEY, {});

    // reads (2 sites):
  - const e = editedAnswersState.current;
  + const e = editedAnswers.current;

    // writes (3 sites): same .update / .set signatures, no changes needed
  ```
- After Spikes 003 + 005 promote, `localStorageWritable` has zero production
  callers — that file (`persistedState.svelte.ts`) becomes deletable, and
  the `Writable<T>` + `toStore()` + `subscribe`-based persistence pattern is
  fully retired from the OpenVAA codebase.

## Investigation Trail

- **2026-05-21** — Scoped scout of `candidateUserDataStore.svelte.ts`:
  identified the 7-line legacy surface. Confirmed the rest ($effect on
  answersLocked, $derived composites for unsavedQuestionIds, etc.) is
  already idiomatic Svelte 5 — no rewrite needed.
- **2026-05-21** — Built scoped spike. Verified composite reactivity +
  persistence end-to-end via browser test. No issues, no surprises.
