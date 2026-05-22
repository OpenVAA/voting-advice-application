# Persistent Rune Stores (runeLocalStorage + Answer Stores)

Replaces the three-layer `$state → localStorageWritable → fromStore` bridge in
the voter and candidate answer stores with a single rune-native helper. After
both production callsites migrate, `localStorageWritable` and the entire
`persistedState.svelte.ts` file become deletable.

## Requirements

- **Persistence helper centralized** — both voter and candidate answer stores
  route through a single `runeLocalStorage` helper that mirrors
  `localStorageWritable`'s versioned-payload format
  (`{ version: number, data: T }`), allowing direct retirement of the legacy
  helper once both callsites migrate.
- **No `svelte/store` imports** — no `fromStore`, no `Writable<T>`, no
  `toStore()`.
- **No `store.subscribe(cb)` for persistence** — write to `localStorage`
  imperatively on `set`/`update`. The legacy approach needs `$effect`/`subscribe`
  because stores don't expose synchronous mutation hooks; runes do.
- **SSR-safe** — gate storage operations on `browser`, mirroring the legacy
  helper.
- **Versioned payload preserved** — `staticSettings.appVersion.version` is
  written; reads check
  `parsed.version >= staticSettings.appVersion.requireUserDataVersion`. Stale
  payloads are deleted from storage and treated as missing.

## How to Build It

### Step 1 — Add the canonical helper

`apps/frontend/src/lib/contexts/utils/runePersistedState.svelte.ts`:

```ts
import { staticSettings } from '@openvaa/app-shared';
import { browser } from '$app/environment';
import { logDebugError } from '$lib/utils/logger';

export interface RunePersistedState<TValue> {
  readonly current: TValue;
  set: (v: TValue) => void;
  update: (fn: (cur: TValue) => TValue) => void;
}

type LocallyStoredValue<TData> = { version: number; data: TData };

export function runeLocalStorage<TValue>(
  key: string,
  defaultValue: TValue
): RunePersistedState<TValue> {
  const initial = readVersioned<TValue>(key) ?? defaultValue;
  let value = $state<TValue>(initial);

  return {
    get current() { return value; },
    set(v) {
      value = v;
      writeVersioned(key, v);
    },
    update(fn) {
      value = fn(value);
      writeVersioned(key, value);
    }
  };
}

function readVersioned<TValue>(key: string): TValue | null {
  if (!browser) return null;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as LocallyStoredValue<TValue>;
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.version === 'number' &&
      parsed.version >= staticSettings.appVersion.requireUserDataVersion
    ) {
      return parsed.data;
    }
    localStorage.removeItem(key);
  } catch (e) {
    logDebugError(`Failed to parse ${key} from localStorage`, e);
  }
  return null;
}

function writeVersioned<TValue>(key: string, value: TValue): void {
  if (!browser) return;
  const payload: LocallyStoredValue<TValue> = {
    version: staticSettings.appVersion.version,
    data: value
  };
  localStorage.setItem(key, JSON.stringify(payload));
}
```

### Step 2 — Migrate voter answerStore

`apps/frontend/src/lib/contexts/voter/answerStore.svelte.ts` — ~10-line diff.
The store gains a `runeLocalStorage` field and drops the three-layer bridge:

```diff
- import { fromStore } from 'svelte/store';
- import { localStorageWritable } from '../utils/persistedState.svelte';
+ import { runeLocalStorage } from '../utils/runePersistedState.svelte';

  export function voterAnswerStore(...) {
-   const _store = localStorageWritable<Frozen<Answers>>(KEY, deepFreeze({}));
-   const _storeState = fromStore(_store);
+   const store = runeLocalStorage<Frozen<Answers>>(KEY, deepFreeze({}));

    function setAnswer(questionId, value) {
-     _store.update((answers) => { /* ... */ });
+     store.update((answers) => {
        const updated = JSON.parse(JSON.stringify(answers)) as Answers;
        if (value === undefined) delete updated[questionId];
        else updated[questionId] = { value };
        return deepFreeze(updated);
      });
    }

    return {
-     get answers() { return _storeState.current; },
+     get answers() { return store.current; },
      setAnswer, deleteAnswer, reset
    };
  }
```

The `JSON.parse(JSON.stringify(...))` defensive clone (rather than
`structuredClone`) is intentional and copied from production
`answerStore.svelte.ts:23` — Svelte 5 `$state` proxies are not
structurally cloneable.

### Step 3 — Migrate candidate edited-answers (~7-line surgical diff)

`apps/frontend/src/lib/contexts/candidate/candidateUserDataStore.svelte.ts` is
**already ~95% rune-native** — only the edited-answer persistence (lines
38-42, 130, 138, 144) bridges through legacy stores. The rest (`$state`,
`$effect`, `$derived.by`, getter exports) stays untouched.

```diff
- import { fromStore } from 'svelte/store';
- import { localStorageWritable } from '../utils/persistedState.svelte';
+ import { runeLocalStorage } from '../utils/runePersistedState.svelte';

- const _editedAnswersStore = localStorageWritable(KEY, {} as LocalizedAnswers);
- const editedAnswersState = fromStore(_editedAnswersStore);
+ const editedAnswers = runeLocalStorage<LocalizedAnswers>(KEY, {});

  // reads (2 sites):
- const e = editedAnswersState.current;
+ const e = editedAnswers.current;

  // writes (3 sites): SAME .update / .set / .update signatures — no change needed
  editedAnswers.update((a) => ({ ...a, [qid]: { value } }));
  editedAnswers.set({});
```

The composite `$derived.by` that merges `saved.answers` with edited overrides
continues to work identically — `editedAnswers.current` is rune-tracked, so
each merge sees a fresh value on every mutation.

### Step 4 — Delete `persistedState.svelte.ts`

After Steps 2 + 3 land in production, `localStorageWritable` has zero callers.
Delete the file. The `Writable<T>` + `toStore()` + `subscribe`-based persistence
pattern is fully retired from the OpenVAA codebase.

## What to Avoid

1. **Don't reach for `$effect`** to persist on change — write imperatively from
   `set`/`update`. `$effect` only fires inside a component init context; the
   stores must work in non-component contexts (e.g. inside `voterContext`
   factories).

2. **Don't use `structuredClone`** to copy `$state` proxies — they're not
   structurally cloneable. Use `JSON.parse(JSON.stringify(...))` matching
   production `answerStore.svelte.ts:23`.

3. **Don't change the storage key or payload shape.** The production helper
   wraps payloads as `{ version, data }` with `staticSettings.appVersion.version`.
   The migration must read existing user data identically — break this and
   every existing user gets a wiped local store.

4. **Don't migrate `answerStore` and `candidateUserDataStore` separately and
   then forget to delete `localStorageWritable`.** Once both callsites land,
   the legacy helper is dead code; leaving it invites future regressions.

5. **Don't try to retain the `Writable<T>` interface** on the new helper. The
   point is to retire the legacy shape entirely. Consumers should not be able
   to call `.subscribe()` or be passed to `fromStore` — those interfaces are
   what was wrong.

## Constraints

- **2 production consumers of `localStorageWritable`** exist:
  - `apps/frontend/src/lib/contexts/voter/answerStore.svelte.ts`
  - `apps/frontend/src/lib/contexts/candidate/candidateUserDataStore.svelte.ts`
- **Tracking-event integration in voter answerStore** (`startEvent` for analytics)
  is orthogonal — production migration re-adds it via a hook param, same as
  today. The spike intentionally omits it.
- **`reloadCandidateData()` and `save()` are out of scope** for this migration —
  those are auth-bound DB operations whose Svelte-store usage is already zero.
- **The composite `$derived.by` merging saved+edited** in
  `candidateUserDataStore` is preserved verbatim — only the `editedAnswers`
  source field swaps from `Writable<T> + fromStore` to `runeLocalStorage`.

## Origin

Synthesized from spikes: 003, 005
Source files available in:
- `sources/003-voter-answer-store-rune/` — `runePersistedState.svelte.ts`,
  `voterAnswerRuneStore.svelte.ts`
- `sources/005-candidate-answer-store-rune/` — `candidateAnswerRuneStore.svelte.ts`
