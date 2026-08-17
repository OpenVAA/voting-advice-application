import { untrack } from 'svelte';

/**
 * Native Svelte 5 rune replacement for the index-based `StackedState` LIFO stack
 * used by the layout-overlay system.
 *
 * The superseded `StackedState` (deleted; see phase 98) implemented a strict-LIFO
 * stack with index-based revert. The consumer-side
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
 * Token-keyed settings overlay registry as a Svelte 5 CLASS (Group F helper;
 * v2.13 context-as-class migration).
 *
 * The reactive core is the private `#slots` `$state` array field, reassigned
 * wholesale on push/revert (CONVENTIONS — a reassigned array field needs no
 * `{current}` handle; the `#current` `$derived` reduce tracks the reassignment).
 * `current`/`size` are prototype getters (this handle is NOT spread — consumers
 * read `.current` / `.push` / `.use` / `.size` directly, so prototype accessors
 * are safe — see spike 020 finding A).
 *
 * `push`/`use` are ARROW-FUNCTION FIELDS: `push` is destructured / called
 * from inside `$effect` bodies (via `use`) and from layout consumers, so it must
 * capture `this` on detach. `use` is the ONE permitted `$effect` — it is a
 * post-construction reaction at the component call site (auto-revert on destroy),
 * not an initialization effect. No `$effect` runs in the constructor; the
 * class is SSR-safe and constructable in any context.
 *
 * The merge runs on every `$derived` re-evaluation, NOT incrementally on push.
 * This is the right trade-off for layout settings (small N, complex merges, rare
 * changes): re-merging is O(N · mergeCost), negligible for typical N=2-3 overlays.
 */
class SettingsOverlay<TMerged, TOverlay = TMerged> implements SettingsOverlayApi<TMerged, TOverlay> {
  #base: TMerged;
  #merge: (acc: TMerged, overlay: TOverlay) => TMerged;
  #nextId = 0;
  // Immutable updates (replace whole array on push/revert) to match the
  // production StackedState's discipline. Cost is O(N) per mutation but N is
  // small (1-3 in practice).
  #slots = $state<Array<{ id: number; overlay: TOverlay }>>([]);
  // The `$derived` reduce is initialized in the constructor (NOT a field
  // initializer) because it reads `#base`/`#merge`, which are assigned from the
  // constructor params — field initializers run before the constructor body, so
  // a `#current = $derived(...this.#base...)` field would read `#base` before it
  // is initialized.
  #current: TMerged;

  /**
   * @param base - The base (default) merged value when no overlays are present.
   * @param merge - Associative merge strategy folding an overlay onto the accumulator.
   */
  constructor(base: TMerged, merge: (acc: TMerged, overlay: TOverlay) => TMerged) {
    this.#base = base;
    this.#merge = merge;
    this.#current = $derived(this.#slots.reduce<TMerged>((acc, slot) => this.#merge(acc, slot.overlay), this.#base));
  }

  push = (overlay: TOverlay): (() => void) => {
    const id = ++this.#nextId;
    // CRITICAL (Pattern 3 / L-2): push() is typically called from inside a
    // $effect body (via use()). The spread `[...slots, ...]` READS `#slots`,
    // which would establish a reactive dependency, and the assignment WRITES
    // `#slots`, creating an immediate effect_update_depth_exceeded loop AND
    // silently disabling the global effect scheduler. `untrack` breaks the
    // read-side of the cycle.
    untrack(() => {
      this.#slots = [...this.#slots, { id, overlay }];
    });
    let alreadyReverted = false;
    return () => {
      if (alreadyReverted) return;
      alreadyReverted = true;
      // Same write-after-read hazard as push — the filter reads `#slots`.
      untrack(() => {
        this.#slots = this.#slots.filter((s) => s.id !== id);
      });
    };
  };

  use = (overlay: TOverlay): void => {
    $effect(() => this.push(overlay));
  };

  get current(): TMerged {
    return this.#current;
  }

  /** Number of live overlays (excluding the base). For testing/debugging. */
  get size(): number {
    return this.#slots.length;
  }
}

/**
 * Creates a settings overlay registry with the supplied merge strategy.
 * @param base - The base (default) merged value when no overlays are present.
 * @param merge - Associative merge strategy folding an overlay onto the accumulator.
 * @returns The `SettingsOverlayApi` (current / push / use / size).
 */
export function settingsOverlay<TMerged, TOverlay = TMerged>(
  base: TMerged,
  merge: (acc: TMerged, overlay: TOverlay) => TMerged
): SettingsOverlayApi<TMerged, TOverlay> {
  return new SettingsOverlay(base, merge);
}
