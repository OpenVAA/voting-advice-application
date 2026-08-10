---
spike: 002
name: dataroot-native-rune
type: standard
validates: 'Given a rune-only `dataRoot` context exposing both reactive `get current()` (version-counter driven) and non-reactive `instance` handles, when sequential `provideElectionData → provideConstituencyData → provideQuestionData → provideEntityData → provideNominationData` calls are made — including from a producer $effect inside untrack() — then (a) downstream $derived consumers re-evaluate on each provide, (b) the producer effect does NOT loop infinitely, (c) no get(store) call exists anywhere in the migrated path'
verdict: VALIDATED
related: [001]
tags: [svelte5, runes, context, dataroot, untrack, migration]
---

# Spike 002 — DataRoot as a Native Svelte 5 Rune

## What This Validates

Replace the hybrid pattern in
`apps/frontend/src/lib/contexts/data/dataContext.svelte.ts` (which holds
`$state` version counter + `writable(dataRoot)` bridge + `reactiveDataRoot.current`
getter) AND eliminate the `get(dataRootStore)` workaround at
`apps/frontend/src/routes/+layout.svelte:110-135` — both with a single
rune-only context API.

## Research

### Why production needs `get(dataRootStore)`

`apps/frontend/src/routes/+layout.svelte:110-117` comment:

> IMPORTANT: access the DataRoot instance via `get(dataRootStore)` rather than
> the `dataRoot.current` auto-subscription form. `dataRoot.current.update(() => provide*(...))`
> inside a `$effect` creates an infinite reactive loop in Svelte 5: the
> `fromStore()` bridge tracks `dataRoot.current` as a dependency, and
> `DataRoot.update()` notifies subscribers (via the dataContext `version++`
> $state) — retriggering the effect.

In other words: the producer effect both READS and WRITES the same reactive
dependency, and Svelte 5's tracking is too eager to break that cycle.
`get(store)` opts out of tracking imperatively.

### Why this isn't a Svelte store problem

DataRoot's `subscribe(handler) / update(transaction)` API (defined in
`packages/data/src/core/updatable.ts`) is a **domain abstraction**, not a
Svelte store. It batches mutation notifications for transactional integrity
across nested provides. It happens to satisfy a partial store-like shape,
which is why `writable(dataRoot)` and `toStore(() => dataRoot)` were able to
bridge it — but those bridges were never structural, they were ergonomic.

This means the rune-native version can keep DataRoot's `Updatable` API
intact AND drop the Svelte store bridge entirely.

### Approach A — version-counter with split handles

Design choice for this spike: instead of trying to make a single
reactive-anywhere getter that doesn't loop, expose **TWO** handles:

- `get current()`: reactive read. Tracks the version-counter dependency.
- `instance`: non-reactive read. Same object, no tracking.

Producers structurally cannot loop because they write to `instance` (no read
dependency); consumers structurally see updates because they read `current`
(implicit version dependency).

The `untrack(() => instance.provide*())` pattern still applies inside the
producer effect to ensure DataRoot's subscribe-callback re-entry doesn't
trigger nested re-runs of the same effect body.

### Approaches B and C (if A fails)

- **Approach B — functional updates**: every `provide*` returns a new
  DataRoot instance. Identity change drives reactivity natively. Cost:
  DataRoot must be cheaply cloneable; would change `@openvaa/data` API.

- **Approach C — structured $state collections in context**: drop DataRoot
  from the context entirely. Context holds `$state<Array<Election>>`,
  `$state<Array<Constituency>>`, etc. DataRoot becomes a transient builder
  reconstructed inside `$derived` if needed. Largest blast radius.

## Implementation

Code lives in `apps/frontend/src/routes/runes-test/contexts/dataRootRuneContext.svelte.ts`.

Key shape:

```ts
export interface DataRootRuneContext {
  readonly current: DataRoot; // reactive
  readonly instance: DataRoot; // non-reactive (same object)
}
```

Consumer patterns demonstrated in `+page.svelte`:

```svelte
<script>
  // 1. .ts $derived (read-side)
  const electionCount = $derived(dataRootCtx.current.elections.length);

  // 2. Producer $effect (write-side) — no get(store)
  $effect(() => {
    const data = page.data?.electionData;
    if (!data) return;
    untrack(() => {
      dataRootCtx.instance.provideElectionData(data);
    });
  });
</script>

<!-- 3. Template direct -->
{dataRootCtx.current.elections.length}
```

## How to Run

```bash
yarn db:start
# navigate to: http://localhost:5173/runes-test
```

Then in the "Spike 002" panel:

1. Click **"1. provide elections + constituencies"** — counts should jump
   from 0 to actual values.
2. Click **"2. provide questions"** — question count populates.
3. Click **"3. provide entities + nominations"** — candidate count populates.
4. Toggle **"Enable producer-$effect"** — repeats step 1 reactively from
   `page.data`. Must not loop, must not crash with
   `effect_update_depth_exceeded`.

## What to Expect

- All count displays update **in sync** across the three consumer patterns
  (template direct, `.ts` `$derived`, `current` direct in template).
- Console shows no `effect_update_depth_exceeded` warnings.
- The producer-$effect toggle does not cause runaway re-renders or
  uncontrolled CPU.
- The log strip below the controls shows step-by-step the sizes before/after
  each provide.

## Observability

Each step writes a timestamped line to the on-page log strip showing the
exact `provide*` calls and the resulting collection sizes — letting the
user see the version-counter propagation cycle from a single user action.

## Investigation Trail

_(Updated as the spike progresses. The spike workflow encourages following
surprising findings, testing edge cases, and documenting pivots between
approaches.)_

- **2026-05-21** — Built initial Approach A: rune context exposing `current`
  (reactive via version counter) + `instance` (non-reactive). DataRoot
  constructed once at init, mutated in place. Producer effect uses
  `untrack(() => instance.update(() => instance.provide*(...)))`. Type-check
  clean. Awaiting browser verification.
- **Hypotheses to test in-browser:**
  - H1: Sequential clicks of steps 1→2→3 update all `$derived` consumers
    on each click without manual refresh.
  - H2: Producer-effect toggle does not loop (untrack breaks the cycle
    even though the same instance handles both read and write).
  - H3: A consumer that does `const dr = $derived(dataRootCtx.current)`
    works correctly when reads happen _inside_ template scope (tracking)
    but a destructure `const dr = dataRootCtx.current; const elections = dr.elections;`
    in `.ts` module scope (no tracking scope) shows the same staleness
    trap documented for `candidateContext` in CLAUDE.md.

## Results

**Verdict:** VALIDATED ✓ (Approach A — version counter + split read/write handles)

Browser verification on 2026-05-21 at http://localhost:5173/runes-test against
the seeded default template:

| Step | Action                                          | Result counts after                                      |
| ---- | ----------------------------------------------- | -------------------------------------------------------- |
| 1    | `provideElectionData + provideConstituencyData` | elections=1, constituencies=5                            |
| 2    | `provideQuestionData` (fetched)                 | questions=24, categories=4                               |
| 3    | `provideEntityData + provideNominationData`     | candidates=327, candidateNominations=327                 |
| —    | Toggle producer-$effect ON                      | (no change; idempotent reapply of step 1 from page.data) |
| —    | Re-click step 1 with producer-effect enabled    | (no compound; no loop, no console error)                 |

**Key findings:**

- All three consumer patterns (template-direct `dataRootCtx.current.X`,
  `.ts` `$derived(dataRootCtx.current.X)`, and the raw template binding
  `dataRootCtx.current.elections?.length`) update **in sync** on every
  provide call. The version-counter `$state` inside the context is a
  reliable bridge from DataRoot's `Updatable.subscribe()` to Svelte 5's
  reactivity graph — no `writable(dataRoot)` bridge needed.
- The producer-$effect with `untrack(() => instance.update(() => instance.provide*()))`
  did **not** trigger `effect_update_depth_exceeded` even though the producer
  shares the same DataRoot instance with consumers. The `instance` (non-reactive)
  vs `current` (reactive) split structurally prevents the read-write cycle.
- `candidateNominations.length === candidates.length === 327`. The 50-row
  delta from the seed's `nominations: 377` total is alliance/organization
  nominations, which DataRoot stores in separate collections —
  `allianceNominations`, `organizationNominations`, etc.

**Signal for the real migration:**

- The clean rune-native API for the production `dataContext` is:
  ```ts
  return setContext(KEY, {
    get current() {
      /* tracks */ return root;
    },
    get instance() {
      /* no track */ return root;
    }
  });
  ```
- The `get(dataRootStore)` workaround at `routes/+layout.svelte:110-135`
  can be replaced 1:1 with `dataRootCtx.instance` inside the existing
  `untrack(() => ...)` wrapper.
- The `dataRoot: dataRootStore, reactiveDataRoot` dual export in production
  can collapse to a single `{ current, instance }` context — `current`
  subsumes `reactiveDataRoot.current`, `instance` subsumes the
  `get(dataRootStore)` pattern.
- Every `$dataRoot.X` template auto-subscribe site (e.g. `EntityInfo.svelte`,
  `ElectionSelector.svelte`, `ConstituencySelector.svelte`) must migrate to
  `dataRootCtx.current.X` — mechanical diff.

**Approach A is sufficient.** Paradigm alteration (Approach B functional updates,
Approach C structured-$state) is NOT required for `dataRoot`.
