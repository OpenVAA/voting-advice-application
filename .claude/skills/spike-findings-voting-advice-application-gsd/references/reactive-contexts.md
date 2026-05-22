# Reactive Contexts (appSettings + dataRoot)

Pure-rune replacements for the `toStore()` / `writable()` / `get(store)` bridges
in `apps/frontend/src/lib/contexts/app/appContext.svelte.ts` and
`apps/frontend/src/lib/contexts/data/dataContext.svelte.ts`. Two patterns
emerged — one for **value-replace contexts** (appSettings) and one for
**mutation-in-place singletons** (DataRoot).

## Requirements

- **No `svelte/store` imports** in migrated contexts — no `writable`, `readable`,
  `derived`, `toStore`, `fromStore`, `get`.
- **No `$store.X` template auto-subscribe** in consumers — template reads via
  `ctx.current.X` or local `$derived` alias.
- **No `get(store)` imperative reads** in producers — write-side mutation idiom
  must avoid both the bridge AND the infinite-loop trap that currently requires
  `get()`.
- **appSettings merge semantics preserved** — effective settings =
  `merge(staticSettings, dynamicSettings, page.data.appSettingsData)`, reactive
  on the third input.
- **appSettings DB-override merge happens at $state init, NOT in an $effect**
  (Spike 008). `$effect` does not run on the server, so an `$effect`-only merge
  produces SSR HTML that's missing the DB override and causes a client-side
  re-render flash. Read `page.data.appSettingsData` synchronously at init; the
  `$effect` then only handles navigation cases.
- **`mergeAppSettings` must be a pure function** (Spike 008). Production today
  uses `Object.assign(target, nonNull)` which mutates the shared
  `staticSettings` reference. Switch to `{ ...target, ...nonNull }`.
- **dataRoot sequential-population semantics preserved** —
  `provideElectionData → provideConstituencyData → provideQuestionData →
  provideEntityData → provideNominationData` each triggers downstream `$derived`
  re-evaluation despite stable DataRoot object identity.

## How to Build It

### Pattern 1 — Value-replace context (appSettings, SSR-aware)

The context's value is fully replaced on each merge. The DB-override merge
runs **synchronously at $state init** so SSR HTML reflects the merged value;
the `$effect` then only handles navigation-changed `page.data`. Reference-
equality guard prevents redundant merges when SvelteKit returns the same
loader payload across navigations. **`mergeAppSettings` must be pure** —
production's `Object.assign`-based helper mutates `staticSettings` and is
revised here.

```ts
// apps/frontend/src/lib/contexts/app/appContext.svelte.ts (migration shape)
import { dynamicSettings, staticSettings, mergeSettings } from '@openvaa/app-shared';
import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { page } from '$app/state';

const CONTEXT_KEY = Symbol('appSettings');

export interface AppSettingsContext {
  readonly current: AppSettings;  // reactive — tracks at call site
}

// Pure replacement for production `mergeAppSettings`. Production mutates the
// target in place via Object.assign — masked today because only one appContext
// initializes per session. Spike 008 surfaced the bug while running two
// variants side-by-side.
function pureMerge<T extends object, U extends object>(target: T, additional: U): T & U {
  const nonNull = Object.fromEntries(Object.entries(additional).filter(([, v]) => v != null));
  return { ...target, ...nonNull } as T & U;
}

export function initAppSettingsContext(): AppSettingsContext {
  // ── Synchronous init reads page.data.appSettingsData on BOTH server and client.
  //    Without this, SSR HTML misses the DB override (effect-only merge doesn't
  //    run on the server) and the client re-renders after $effect fires.
  const initialDbData = page.data?.appSettingsData as DynamicSettings | Error | undefined;
  let initial = pureMerge(staticSettings, dynamicSettings);
  if (initialDbData && !(initialDbData instanceof Error)) {
    initial = pureMerge(initial, initialDbData);
  }
  let value = $state<AppSettings>(initial);

  // $effect only handles "page.data changed after navigation". Initial-merge
  // responsibility is gone — value is already correct at first render.
  let prevData: DynamicSettings | Error | undefined = initialDbData;
  $effect(() => {
    const data = page.data?.appSettingsData;
    if (data === prevData) return;
    prevData = data;
    if (!data || data instanceof Error) return;
    value = pureMerge(value, data);
  });

  return setContext(CONTEXT_KEY, {
    get current() { return value; }
  });
}
```

**Same pattern applies to `appCustomizationData`** at `appContext.svelte.ts:110-118` —
it has the same `$effect`-only merge shape and the same SSR gap.

**Consumer migration (mechanical search-and-replace):**

```diff
- {$appSettings.publisher.name}
+ {appSettings.current.publisher.name}

- import { get } from 'svelte/store';
- const platform = get(appSettings).analytics?.platform;
+ const platform = $derived(appSettings.current.analytics?.platform);
```

### Pattern 2 — Mutation-in-place singleton (DataRoot)

DataRoot's identity is **stable** (the same `DataRoot` instance lives for the
session's lifetime) but its **internal state mutates** via
`provide*` methods that batch through `Updatable.subscribe()`. Naïve
re-assignment doesn't work (you can't replace the instance — it's referenced
elsewhere). Instead, expose **two handles**:

```ts
// apps/frontend/src/lib/contexts/data/dataContext.svelte.ts (migration shape)
import { DataRoot } from '@openvaa/data';
import { getContext, hasContext, setContext } from 'svelte';

const CONTEXT_KEY = Symbol('dataRoot');

export interface DataRootContext {
  readonly current: DataRoot;   // reactive — tracks the version counter
  readonly instance: DataRoot;  // non-reactive — same object, no dependency
}

export function initDataRootContext(): DataRootContext {
  const root = new DataRoot();

  let version = $state(0);
  root.subscribe(() => { version++; });

  return setContext(CONTEXT_KEY, {
    get current() {
      void version;  // establish dependency
      return root;
    },
    get instance() {
      return root;   // no version read — non-reactive
    }
  });
}
```

**Consumer pattern — reads use `current`, writes use `instance` inside
`untrack()`:**

```ts
// READ-side (.ts or template) — always via `current`
const electionCount = $derived(dataRoot.current.elections.length);

// WRITE-side (producer $effect) — `instance` + untrack
$effect(() => {
  const electionData = page.data?.electionData;
  if (!electionData || electionData instanceof Error) return;
  untrack(() => {
    dataRoot.instance.update(() => {
      dataRoot.instance.provideElectionData(electionData);
      dataRoot.instance.provideConstituencyData(page.data.constituencyData);
    });
  });
});
```

The `instance` handle structurally cannot create a read-write loop because
reading it does not touch the version counter — only `current` does.

### Context destructuring rule (CLAUDE.md)

These migrated contexts inherit the same constraint as
`candidateContext.svelte.ts`. **Reactive accessors must be read via property
access at the call site**, not destructured into local vars:

```ts
const ctx = getAppSettingsContext();
const value = $derived(ctx.current);                    //  correct — read at call site
// const { current } = ctx;                             //  WRONG — captures init-time snapshot
```

See CLAUDE.md "Context Destructuring Rule (Svelte 5)" for the full explanation.

## What to Avoid

1. **Don't destructure `current` or `instance` into a local var.** Destructuring
   invokes the getter ONCE at init and binds the captured value. Subsequent
   reads of the local don't re-invoke the getter, so they don't propagate
   dependency invalidation. (Same trap as the production
   `candidateContext` issue documented in CLAUDE.md.)

2. **Don't read `instance` from a `$derived` or `$effect` that's supposed to
   track DataRoot updates.** `instance` is intentionally non-reactive. Use
   `current` for tracked reads.

3. **Don't write through `current`.** `current` establishes a read dependency.
   Writing via `current.update(...)` from inside an `$effect` creates the
   infinite-loop trap that the `instance` split was designed to prevent.

4. **Don't omit the reference-equality guard in the appSettings merge `$effect`.**
   SvelteKit returns the same loader payload object across navigations that
   share the same loader inputs. Without the guard, `mergeAppSettings` produces
   a new object on every nav, cascading filter recreation through downstream
   contexts.

6. **Don't rely on `$effect` for the initial appSettings merge.** `$effect`
   does NOT run during SSR — the server-rendered HTML will reflect only
   `staticSettings ∪ dynamicSettings`, missing the DB override. On slow
   connections this produces a visible "default → DB-override" flash on
   first paint. Spike 008 verified the gap via curl on real SSR output.

7. **Don't ship `mergeAppSettings` as mutative.** `apps/frontend/src/lib/utils/settings.ts:12-20`
   uses `Object.assign(target, nonNull)` which mutates the shared
   `staticSettings` reference. In production today this is masked because
   only one appContext initializes per session — but the signature implies
   purity. Spike 008 stumbled into this when two side-by-side variants
   polluted each other's `$state` through the shared `staticSettings` object.
   Switch to a pure `{ ...target, ...nonNull }` merge as part of the
   migration; the diff is low-risk.

5. **Don't try to make DataRoot functional/immutable** (per-provide identity
   change) just to avoid the version counter. The mutation-in-place idiom is
   the validated path — Approach B (functional updates) and Approach C
   (structured `$state` collections) from the spike research were rejected as
   paradigm changes that the migration doesn't need.

## Constraints

- **DataRoot `Updatable.subscribe()` is a domain abstraction**, not a Svelte
  store. It batches mutation notifications for transactional integrity across
  nested `provide*` calls. Keep it intact — bridge to runes via the version
  counter, don't try to replace it.
- **17+ `$appSettings.X` template sites** must migrate to `appSettings.current.X`
  — TypeScript catches all of them after the context API change. Mechanical diff.
- **14+ `$dataRoot.X` template sites** likewise migrate to `dataRoot.current.X`.
- **The production `appContext` reference-equality guard** at
  `appContext.svelte.ts:93-100` is reproduced verbatim in the spike; preserve it.

## Related

See [[context-orchestration]] for how appSettings + dataRoot compose with a
downstream `voterRuneContext` / `candidateRuneContext` factory and how the
destructure-trap appears across the cascade. See [[migration-inventory-and-order]]
for the full Tier 1/2/3 list of remaining `svelte/store` bridges to migrate
after these two contexts land.

## Origin

Synthesized from spikes: 001, 002, 008
Source files available in:
- `sources/001-appsettings-native-rune/appSettingsRuneContext.svelte.ts`
- `sources/002-dataroot-native-rune/dataRootRuneContext.svelte.ts`
- `sources/008-ssr-hydration-runes/appSettingsVariantB.svelte.ts` — the SSR-aware shape promoted here
