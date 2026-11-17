import { untrack } from 'svelte';

/**
 * SPIKE 006 — Native Svelte 5 rune replacement for `StackedState`.
 *
 * Production `apps/frontend/src/lib/contexts/utils/StackedState.svelte.ts`
 * implements a strict-LIFO stack with index-based revert, exposed via a
 * `Readable<T>` bridge (`implements Readable<T>` + `toStore()` + `subscribe`
 * getter) for legacy `$store.X` template compatibility.
 *
 * The consumer-side bookkeeping is also legacy:
 * `getLayoutContext(onDestroy)` snapshots stack lengths at call time, then
 * registers an `onDestroy` callback to revert each stack to that index.
 * Caller MUST pass `onDestroy` — silent breakage if forgotten.
 *
 * This rune replaces both with a TOKEN-KEYED overlay registry:
 *   - `push(overlay)` returns a `() => void` revert function (no index leak).
 *   - `current` is a `$derived` over the registry, merged in mount-order.
 *   - `use(overlay)` is a one-liner declarative API: it pushes AND registers
 *     `$effect` cleanup, so consumers never see the bookkeeping.
 *
 * Robustness gains vs StackedState:
 *   1. No index drift — concurrent mounts/unmounts in any order produce a
 *      correct merged result. With indexes, a parent that destroys before
 *      its child re-uses the child's slot incorrectly.
 *   2. No onDestroy import or plumbing required by callers.
 *   3. No `svelte/store` imports, no `Readable<T>` shim, no `subscribe` getter.
 *   4. Cleanup is structural: returned from push(), called by $effect. A
 *      caller cannot push without holding (and dropping at the right time)
 *      the cleanup token.
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
 * The merge runs on every $derived re-evaluation, NOT incrementally on push.
 * This is the right trade-off for layout settings (small N, complex merges,
 * rare changes): re-merging is O(N · mergeCost), which is negligible for
 * typical N=2-3 overlays.
 */
export function settingsOverlay<TMerged, TOverlay = TMerged>(
  base: TMerged,
  merge: (acc: TMerged, overlay: TOverlay) => TMerged
): SettingsOverlayApi<TMerged, TOverlay> {
  type Slot = { id: number; overlay: TOverlay };
  let nextId = 0;
  // Immutable updates (replace whole array on push/revert) to match the
  // production StackedState's discipline. Cost is O(N) per mutation but N
  // is small (1-3 in practice). The simpler-but-equivalent in-place
  // .push/.splice on a Svelte 5 $state array would also track correctly,
  // but immutability keeps consumers cleanly $derived-able without
  // worrying about deep mutation tracking on slot.overlay.
  let slots = $state<Array<Slot>>([]);

  const current = $derived(slots.reduce<TMerged>((acc, slot) => merge(acc, slot.overlay), base));

  function push(overlay: TOverlay): () => void {
    const id = ++nextId;
    // CRITICAL: push() is typically called from inside a $effect body (via
    // `use()`). The spread `[...slots, ...]` reads `slots` which would
    // establish a reactive dependency, and the assignment writes `slots`,
    // creating an immediate effect_update_depth_exceeded loop. `untrack`
    // breaks the read-side of the cycle — same mitigation used in Spike 002's
    // dataRoot producer pattern.
    untrack(() => {
      slots = [...slots, { id, overlay }];
    });
    let alreadyReverted = false;
    return () => {
      if (alreadyReverted) return;
      alreadyReverted = true;
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
