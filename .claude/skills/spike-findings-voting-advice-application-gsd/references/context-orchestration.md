# Context Orchestration (voterContext + candidateContext factories)

How to compose `appSettings` (see [[reactive-contexts]] Pattern 1) +
`dataRoot` (Pattern 2) + answer stores (see [[persistent-rune-stores]]) into
a rune-native `voterContext` / `candidateContext` factory that mirrors the
production shape — with the **destructure trap** documented in CLAUDE.md
remaining the only consumer-side caveat. Also captures HMR DX behavior
(Spike 011) of the orchestrated cascade.

## Requirements

- **Reactive accessors exposed as getters** — every `$state`/`$derived`-backed
  field on the context must be a `get foo()` accessor, not a plain property,
  so dependency tracking happens at the consumer call site.
- **Destructure trap is paradigm-preserving** — the CLAUDE.md "Context
  Destructuring Rule" applies UNCHANGED to migrated voter/candidate contexts.
  No new consumer rules.
- **Full cascade must propagate end-to-end** —
  `appSettings.current → page.data → dataRoot.current → voterContext`
  mutations → `voterContext.opinionQuestions ($derived)` →
  `matchStore.value`. Single answer-button click must re-render the matches.
- **No `svelte/store` imports** in the orchestrator — drops every `fromStore`
  / `Writable<T>` / `toStore()` site from production's
  `voterContext.svelte.ts` (474 lines) and `candidateContext.svelte.ts`.
- **Producer `$effect`s must use `untrack()` for write-after-read on shared
  `$state`** — same invariant as [[reactive-contexts]] DataRoot producer and
  [[layout-overlay-registry]] overlay registry.

## How to Build It

### Factory shape

The orchestrator pulls upstream contexts via `getXContext()`, instantiates
local stores it owns, declares `$state`/`$derived` for derived fields, and
exposes each as a getter:

```ts
// apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts (migration shape)
import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { getAppSettingsContext } from '../app/appContext.svelte';
import { getDataRootContext } from '../data/dataContext.svelte';
import { voterAnswerStore } from './answerStore.svelte';

const CONTEXT_KEY = Symbol('voterContext');

export interface VoterContext {
  // Mutators (stable references — destructuring is safe per CLAUDE.md)
  selectElection: (election: Election | undefined) => void;
  setAnswer: (questionId: string, value: unknown) => void;
  // Stable handle that doesn't change identity — also safe to destructure
  readonly voterAnswers: VoterAnswerStore;

  // ── Reactive accessors — MUST be read via ctx.X, NEVER destructured ──
  readonly selectedElections: ReadonlyArray<Election>;
  readonly opinionQuestions: ReadonlyArray<AnyQuestionVariant>;
  readonly matchesCount: number;
  readonly profileComplete: boolean;
  // ... and the rest of the 18+ accessors from production
}

export function initVoterContext(): VoterContext {
  if (hasContext(CONTEXT_KEY)) error(500, 'initVoterContext() called twice');

  const appSettings = getAppSettingsContext(); // Spike 001 / 008
  const dataRoot = getDataRootContext(); // Spike 002
  const voterAnswers = voterAnswerStore({
    /* … */
  }); // Spike 003

  let _selectedElections = $state<Array<Election>>([]);

  const _opinionQuestions = $derived.by(() => {
    if (_selectedElections.length === 0) return [];
    const all = dataRoot.current.questions ?? [];
    return all.filter((q) => q.matchable); // production uses the `matchable` getter
  });

  const _matchesCount = $derived.by(() => {
    if (Object.keys(voterAnswers.answers).length === 0) return 0;
    return (dataRoot.current.candidates ?? []).length;
  });

  const _profileComplete = $derived(Object.keys(voterAnswers.answers).length > 0);

  return setContext(CONTEXT_KEY, {
    selectElection: (e) => {
      _selectedElections = e ? [e] : [];
    },
    setAnswer: voterAnswers.setAnswer,
    voterAnswers,
    get selectedElections() {
      return _selectedElections;
    },
    get opinionQuestions() {
      return _opinionQuestions;
    },
    get matchesCount() {
      return _matchesCount;
    },
    get profileComplete() {
      return _profileComplete;
    }
  });
}
```

### Consumer pattern (CLAUDE.md Context Destructuring Rule)

```ts
//  CORRECT — reactive accessors read via ctx.X
const ctx = getVoterContext();
const opinionQuestions = $derived(ctx.opinionQuestions);
const matchesCount = $derived(ctx.matchesCount);

// Stable references — destructure is fine
const { t, getRoute, voterAnswers, selectElection } = ctx;

//  WRONG — captures initial empty array, never updates
const { opinionQuestions, matchesCount } = ctx;
```

### Migration delta from production

For each of the 18+ getters in `voterContext.svelte.ts` and 30+ in
`candidateContext.svelte.ts`, the migration is:

- Drop `import { fromStore } from 'svelte/store'`.
- `const appSettingsState = fromStore(appSettings)` → replace with
  `const appSettings = getAppSettingsContext()` and read `appSettings.current.X`
  inside `$derived.by` bodies.
- `const localeState = fromStore(locale)` → replace once `locale` migrates
  (see [[migration-inventory-and-order]] Wave 2).
- `firstQuestionIdState = fromStore(sessionStorageWritable(...))` → replace
  with `runeSessionStorage` (sibling of `runeLocalStorage` from Spike 003 —
  needs adding as part of Wave 2 setup).

## What to Avoid

1. **Don't destructure reactive accessors at the call site.** This is the
   documented Phase 61 production bug, and Spike 007 verified it reproduces
   identically in the rune-native version. The codemod ([[consumer-migration-codemod]])
   has a destructure-trap audit pass that flags every callsite.

2. **Don't spread one context into another to compose them.** Object spread
   invokes each getter ONCE at spread time and captures the value, breaking
   the reactive edge. Spike 009 found this anti-pattern in
   `apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts:97`:

   ```ts
   //  WRONG — `...appContext` snapshots every accessor at this line
   const adminContext = { ...appContext, ...authContext, jobs };

   //  CORRECT — re-declare the getters to preserve the reactive chain
   const adminContext = {
     get isAuthenticated() {
       return authContext.isAuthenticated;
     },
     get t() {
       return authContext.t;
     }
     // ... or keep auth as a separate handle the caller pulls explicitly
   };
   ```

3. **Don't pass `voterAnswers.answers` (the value) to downstream consumers.**
   Pass the `voterAnswers` store object — `matchStore` (see
   [[matching-integration]]) reads `.answers` per-evaluation inside its
   `$derived.by`. Passing the value snapshots it and breaks reactivity.

4. **Don't rely on HMR-driven manual testing to validate destructure-trap
   absence.** Spike 011 found that HMR remount re-captures destructured
   locals at the CURRENT state, masking the trap until the next mutation.
   Run the [[consumer-migration-codemod]] audit pass as part of pre-commit
   or CI.

## HMR DX behavior (Spike 011)

Vite HMR on rune-context edits behaves as follows:

| Surface                                               | Survives HMR? | Why                                                            |
| ----------------------------------------------------- | ------------- | -------------------------------------------------------------- |
| `$state` in `.svelte` files (e.g. log arrays)         | ✗             | Standard Svelte HMR remount; resets to declared default        |
| `runeLocalStorage`-backed state (e.g. voter answers)  | ✓             | Rehydrated from storage on construction                        |
| Class-instance singletons in parent layout (DataRoot) | ✓             | Held by parent context whose layout doesn't remount            |
| `$derived` of survivors (e.g. matchesCount)           | ✓             | Recomputed from preserved sources                              |
| Destructure-trap consumers                            | ✓-then-✗      | **Re-capture at remount** then go stale again on next mutation |

Implications:

- Component remount on HMR is **correct behavior** — if `$state` survived,
  in-flight values could leak across edits.
- `runeLocalStorage`'s synchronous `set`/`update` writes mean HMR-cycle data
  is always consistent (vs. legacy `store.subscribe(saveToStorage)` which
  fires async and can race with HMR timing).
- Zero `effect_update_depth_exceeded` warnings across HMR cycles when
  `untrack()` discipline is followed (see [[reactive-contexts]] Pattern 2 and
  [[layout-overlay-registry]]).
- Zero hydration-mismatch warnings (HMR does not re-trigger hydration; it
  only re-renders).

## Constraints

- **Spike 007 used the seeded `default` template** (327 candidates, 1
  election, 24 questions, 18 of which are `singleChoiceOrdinal`). The
  cascade-verified counts at every step:

  | Step                  | selectedElections | opinionQuestions | matchesCount | profileComplete |
  | --------------------- | ----------------- | ---------------- | ------------ | --------------- |
  | init / load           | 0                 | 0                | 0            | false           |
  | select first election | 1                 | 18               | 0            | false           |
  | set 3 demo answers    | 1                 | 18               | 327          | true            |
  | deselect + clear      | 0                 | 0                | 0            | false           |

- **Production has a "matchable" getter on question subclasses** — Spike 007
  initially filtered by `q.matchable === true` (returned 0 because it's a
  getter, not a property). The migration uses `q.matchable` (which invokes
  the getter); this works correctly. The spike's `q.type === 'singleChoiceOrdinal'`
  proxy is a spike-scope simplification, not the production filter.

- **Production `voterContext` has 18+ reactive accessors;
  `candidateContext` has 30+.** The migration for each is mechanical (drop
  `fromStore`, expose as getter). The accessor list lives in CLAUDE.md
  "Context Destructuring Rule" and is the same list [[consumer-migration-codemod]]
  uses to audit destructure traps.

## Origin

Synthesized from spikes: 007, 011

Source files available in:

- `sources/007-context-orchestration-end-to-end/voterRuneContext.svelte.ts` — scoped factory
- `sources/007-context-orchestration-end-to-end/CanonicalConsumer.svelte` — `ctx.X` reads
- `sources/007-context-orchestration-end-to-end/DestructureTrapConsumer.svelte` — anti-pattern demo
- `sources/007-context-orchestration-end-to-end/page.svelte` — full cascade harness
- `sources/011-hmr-rune-contexts/README.md` — HMR investigation trail (no separate sources;
  used Spike 007's environment as the test bed)
