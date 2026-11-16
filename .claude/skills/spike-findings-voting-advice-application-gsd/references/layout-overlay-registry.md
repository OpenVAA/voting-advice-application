# Layout Overlay Registry (replaces StackedState + getLayoutContext)

Replaces `apps/frontend/src/lib/contexts/utils/StackedState.svelte.ts`
(class with `implements Readable<T>` + `toStore()` + `subscribe` getter) AND
the `getLayoutContext(onDestroy)` consumer pattern at
`apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts:169-181` with
a single rune-native, **token-keyed overlay registry**. The result is more
robust (no index drift on out-of-order mount/unmount), easier to use (one-line
`useTopBar(...)` instead of `topBarSettings.push(...) + onDestroy(...)`), and
fully idiomatic Svelte 5.

## Requirements

- **No `svelte/store` imports.** No `Readable<T>`, no `toStore()`, no
  `subscribe()` getter on the registry.
- **No `onDestroy` plumbing in callers** — overlay lifetime tracks the
  component lifetime via `$effect` cleanup.
- **Robust to out-of-order unmount** — if a parent layout destroys while its
  child still lives, the child's overlay remains active. Index-based revert
  cannot guarantee this.
- **Producer effect must not loop** — wrapping a rune $state collection in an
  `$effect`-scoped helper triggers `effect_update_depth_exceeded`unless the
read-side is wrapped in`untrack()`. Same trap as [[reactive-contexts]]
  DataRoot producer; the fix is identical.
- **`mergeSettings()` associativity preserved** — the registry approach
  (`current = slots.reduce(merge, base)`) is mathematically equivalent to the
  strict-LIFO `StackedState` for the merge _result_; only cleanup semantics
  improve.

## How to Build It

### Step 1 — Generic overlay registry factory

`apps/frontend/src/lib/contexts/utils/settingsOverlay.svelte.ts`:

```ts
import { untrack } from 'svelte';

export interface SettingsOverlayApi<TMerged, TOverlay = TMerged> {
  readonly current: TMerged;
  /** Manual push. Returns the revert function (call it to remove the overlay). */
  push: (overlay: TOverlay) => () => void;
  /**
   * Declarative scoped push. Equivalent to `$effect(() => push(overlay))`.
   * Auto-reverts on component destroy. MUST be called from a component
   * init context.
   */
  use: (overlay: TOverlay) => void;
  /** Live overlay count (excluding base). For testing/debugging. */
  readonly size: number;
}

export function settingsOverlay<TMerged, TOverlay = TMerged>(
  base: TMerged,
  merge: (acc: TMerged, overlay: TOverlay) => TMerged
): SettingsOverlayApi<TMerged, TOverlay> {
  type Slot = { id: number; overlay: TOverlay };
  let nextId = 0;
  let slots = $state<Array<Slot>>([]);

  const current = $derived(slots.reduce<TMerged>((acc, s) => merge(acc, s.overlay), base));

  function push(overlay: TOverlay): () => void {
    const id = ++nextId;
    // CRITICAL: push() is called from inside a $effect body via use().
    // The read `[...slots, ...]` AND the assignment to `slots` touch the same
    // $state, creating effect_update_depth_exceeded. untrack() breaks the
    // read-side of the cycle. Same mitigation as Spike 002's dataRoot producer.
    untrack(() => {
      slots = [...slots, { id, overlay }];
    });
    let reverted = false;
    return () => {
      if (reverted) return;
      reverted = true;
      untrack(() => {
        slots = slots.filter((s) => s.id !== id);
      });
    };
  }

  function use(overlay: TOverlay): void {
    $effect(() => push(overlay));
  }

  return {
    get current() {
      return current;
    },
    push,
    use,
    get size() {
      return slots.length;
    }
  };
}
```

### Step 2 — Wrap the three layout surfaces in a context

`apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts` (migration shape):

```ts
import { mergeSettings } from '@openvaa/app-shared';
import { settingsOverlay } from '../utils/settingsOverlay.svelte';

const CONTEXT_KEY = Symbol('layoutSettings');

export function initLayoutContext(): LayoutContext {
  const topBar = settingsOverlay<TopBarSettings, DeepPartial<TopBarSettings>>(DEFAULT_TOP_BAR, (acc, ov) =>
    mergeSettings(acc, ov)
  );
  const pageStyles = settingsOverlay<PageStyles, DeepPartial<PageStyles>>(DEFAULT_PAGE_STYLES, (acc, ov) =>
    mergeSettings(acc, ov)
  );
  const navigation = settingsOverlay<NavigationSettings, DeepPartial<NavigationSettings>>(
    DEFAULT_NAVIGATION,
    (acc, ov) => mergeSettings(acc, ov)
  );

  return setContext(CONTEXT_KEY, {
    topBar,
    pageStyles,
    navigation,
    useTopBar: (o) => topBar.use(o),
    usePageStyles: (o) => pageStyles.use(o),
    useNavigation: (o) => navigation.use(o)
  });
}
```

### Step 3 — Migrate the 28 push callsites + 14 getLayoutContext callsites

Producer pattern goes from imperative-with-onDestroy to declarative-with-$effect:

```diff
- // Before (production today):
- const { topBarSettings, pageStyles } = getLayoutContext(onDestroy);
- topBarSettings.push({ progress: 'fixed-bottom' });
- pageStyles.push({ drawer: { background: 'bg-base-300' } });

+ // After (post-migration):
+ const layout = getLayoutContext();
+ layout.useTopBar({ progress: 'fixed-bottom' });
+ layout.usePageStyles({ drawer: { background: 'bg-base-300' } });
```

Consumers reading the merged settings switch from `$topBarSettings.X` /
`topBarSettings.current.X` auto-subscribe to:

```ts
const topBar = $derived(layout.topBar.current);
// {topBar.progress}, {topBar.actions.feedback}, etc.
```

### Step 4 — Delete `StackedState.svelte.ts`

After migration, `StackedState` has zero callers. Delete the file. The
`Readable<T>` shim + `toStore()` + cached `subscribe` getter are eliminated
from the codebase.

## What to Avoid

1. **Don't write `slots = [...slots, newSlot]` without `untrack()`** when the
   helper runs inside `$effect`. This is the `effect_update_depth_exceeded`
   trap — Spike 006's first verification attempt hit it. Worse: the loop
   doesn't just break the failing component, it **breaks the global effect
   scheduler**, silently blocking subsequent components' `$effect`s.
   See [[reactive-contexts]] DataRoot producer for the same trap; the fix
   is identical.

2. **Don't use index-based revert.** The whole point of the token-keyed
   registry is to fix index drift on out-of-order mount/unmount. Going back
   to indexes loses the robustness gain — a parent layout that destroys
   before its child re-uses the child's slot, popping the wrong overlay.

3. **Don't expose `subscribe()` or `toStore()` on the registry.** The
   `Readable<T>` shape is what was wrong. The migration is value-add only if
   the legacy interface is gone.

4. **Don't keep `getLayoutContext(onDestroy)`** as a "compatibility wrapper".
   The `onDestroy` arg is the bug — it's silent breakage if forgotten. Force
   callers to the `use*()` API.

5. **Don't use in-place `.push()` / `.splice()` on the `$state` array.**
   While Svelte 5 tracks deep mutations on `$state` arrays correctly, the
   immutable update keeps the registry cleanly `$derived`-able without
   worrying about mutation tracking on `slot.overlay`. Match the production
   `StackedState` discipline of immutable updates.

## Constraints

- **28 `*.push(...)` callsites** for layout overlays exist across the frontend
  (per scouting). All become trivially editable to `use*()`.
- **14+ `getLayoutContext(onDestroy)` callsites** exist (per scouting). All
  drop the `onDestroy` arg and import.
- **`mergeSettings` from `@openvaa/app-shared`** is associative — required
  for the registry approach to match the LIFO stack's merge result. If a
  future settings surface requires non-associative merge, that surface
  cannot use this registry pattern.
- **Producer effects must run from a component init context** for `use()`
  to register `$effect` cleanup. Calling `use()` outside an init context is
  a programmer error (caught by Svelte at runtime).

## Origin

Synthesized from spikes: 006
Source files available in:

- `sources/006-layout-overlay-rune/SettingsOverlay.svelte.ts` — generic registry
- `sources/006-layout-overlay-rune/layoutSettingsRune.svelte.ts` — context wrapper
- `sources/006-layout-overlay-rune/MockRoute.svelte` — declarative consumer demo
- `sources/006-layout-overlay-rune/page.svelte` — toggle harness with predicted
  merge guide
