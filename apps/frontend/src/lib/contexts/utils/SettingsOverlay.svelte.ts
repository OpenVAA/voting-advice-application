import { untrack } from 'svelte';

/**
 * Native Svelte 5 rune replacement for the index-based `StackedState` LIFO stack
 * used by the layout-overlay system (CTX-04 / D-07).
 *
 * `StackedState` (still present at `./StackedState.svelte.ts`; deleted in Phase 98)
 * implements a strict-LIFO stack with index-based revert. The consumer-side
 * bookkeeping (the old `getLayoutContext` taking an `onDestroy` argument) snapshots
 * stack lengths at call time, then registers an `onDestroy` callback to revert each
 * stack to that index. The
 * caller MUST pass `onDestroy` — silent breakage if forgotten — and out-of-order
 * mount/unmount corrupts the merged result (a parent destroyed before its child
 * re-uses the child's slot incorrectly).
 *
 * This registry replaces both with a TOKEN-KEYED overlay registry:
 *   - `push(overlay)` returns a `() => void` revert function (no index leak).
 *   - `current` is a `$derived` over the registry, merged in mount-order.
 *   - `use(overlay)` is the declarative consumer API: it pushes AND registers
 *     `$effect` cleanup, so callers never see the bookkeeping (and never need
 *     `onDestroy`).
 *
 * Robustness gains vs `StackedState`:
 *   1. No index drift — concurrent mounts/unmounts in any order produce a correct
 *      merged result (out-of-order revert removes only the matching token).
 *   2. No `onDestroy` import or plumbing required by callers.
 *   3. No `svelte/store` imports, no `Readable<T>` shim, no `subscribe` getter.
 *   4. Cleanup is structural: returned from `push()`, called by `$effect`.
 *
 * The merge MUST be associative (`mergeSettings` from `@openvaa/app-shared` is) so
 * the token-keyed `reduce` result is identical to the old strict-LIFO stack.
 */

export interface SettingsOverlayApi<TMerged, TOverlay = TMerged> {
  /** Effective merged settings. Reactive. */
  readonly current: TMerged;
  /**
   * Push an overlay onto the registry. Returns the revert function — call it
   * (or let `use()` call it for you) to remove the overlay. Idempotent: calling
   * revert twice is a no-op.
   */
  push: (overlay: TOverlay) => () => void;
  /**
   * Declarative scoped push. Equivalent to:
   *   `$effect(() => settings.push(overlay));`
   * Auto-reverts when the calling component is destroyed.
   *
   * MUST be called from a component init context (so `$effect` is valid).
   */
  use: (overlay: TOverlay) => void;
  /** Number of live overlays (excluding the base). For testing/debugging. */
  readonly size: number;
}

/**
 * Creates a settings overlay registry with the supplied merge strategy.
 *
 * The merge runs on every `$derived` re-evaluation, NOT incrementally on push.
 * This is the right trade-off for layout settings (small N, complex merges, rare
 * changes): re-merging is O(N · mergeCost), negligible for typical N=2-3 overlays.
 * @param base - The base (default) merged value when no overlays are present.
 * @param merge - Associative merge strategy folding an overlay onto the accumulator.
 * @returns The `SettingsOverlayApi` (current / push / use / size).
 */
export function settingsOverlay<TMerged, TOverlay = TMerged>(
  base: TMerged,
  merge: (acc: TMerged, overlay: TOverlay) => TMerged
): SettingsOverlayApi<TMerged, TOverlay> {
  type Slot = { id: number; overlay: TOverlay };
  let nextId = 0;
  // Immutable updates (replace whole array on push/revert) to match the
  // production StackedState's discipline. Cost is O(N) per mutation but N is
  // small (1-3 in practice).
  let slots = $state<Array<Slot>>([]);

  const current = $derived(slots.reduce<TMerged>((acc, slot) => merge(acc, slot.overlay), base));

  function push(overlay: TOverlay): () => void {
    const id = ++nextId;
    // CRITICAL (Pattern 3 / L-2): push() is typically called from inside a
    // $effect body (via use()). The spread `[...slots, ...]` READS `slots`,
    // which would establish a reactive dependency, and the assignment WRITES
    // `slots`, creating an immediate effect_update_depth_exceeded loop AND
    // silently disabling the global effect scheduler. `untrack` breaks the
    // read-side of the cycle.
    untrack(() => {
      slots = [...slots, { id, overlay }];
    });
    let alreadyReverted = false;
    return () => {
      if (alreadyReverted) return;
      alreadyReverted = true;
      // Same write-after-read hazard as push — the filter reads `slots`.
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
