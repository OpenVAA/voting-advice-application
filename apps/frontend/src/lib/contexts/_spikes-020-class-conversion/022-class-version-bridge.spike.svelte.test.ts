import { flushSync, untrack } from 'svelte';
import { describe, expect, it } from 'vitest';

/**
 * SPIKE 022 — Group C, version-bridge singleton (the dataRoot pattern) as a CLASS.
 *
 * This is Spike 017's read/write split, re-expressed as a class. The foreign
 * mutable singleton (DataRoot / FilterGroup) has a STABLE identity and is mutated
 * in place; a private `#version` $state counter, bumped (untracked) on the
 * singleton's `subscribe` notification, is the only reactive signal.
 *
 * Class shape under test:
 *   - `get dataRoot()` — reactive READ (touches #version), bare (no `.current`).
 *   - `setDataRoot = (updater) => untrack(() => updater(root))` — WRITE concern;
 *     internalizes the producer's hand-written `untrack`, so the public
 *     `.instance` handle (E3) is eliminable. Arrow field → survives detach.
 *
 * Verifies the 017 findings hold in the class shape: reactivity survives the bare
 * getter; a producer effect calling the setter does NOT loop; and a producer
 * reading the reactive getter DOES loop (proving the setter's internal untrack is
 * the load-bearing part). This is the group the audit flagged as NOT simplifying
 * away — the bridge is intrinsic to wrapping a non-rune library object.
 */

/** Minimal faithful model of @openvaa/data's DataRoot reactive contract (from 017). */
class FakeDataRoot {
  electionData: Array<number> = [];
  #subs = new Set<() => void>();
  subscribe(cb: () => void): () => void {
    this.#subs.add(cb);
    return () => this.#subs.delete(cb);
  }
  update(fn: () => void): void {
    fn();
    this.#subs.forEach((cb) => cb());
  }
  provideElectionData(d: Array<number>): void {
    this.electionData = d;
  }
}

/** Version-bridge context as a class (017 read/write split, class-shaped). */
class DataContext {
  #root = new FakeDataRoot();
  #version = $state(0);

  constructor() {
    this.#root.subscribe(() => {
      untrack(() => {
        this.#version++;
      });
    });
  }

  // READ — reactive via #version, bare getter (no { current, instance }).
  get dataRoot(): FakeDataRoot {
    void this.#version;
    return this.#root;
  }

  // WRITE — non-reactive path, untrack internalized. Arrow field → detach-safe.
  setDataRoot = (updater: (dr: FakeDataRoot) => void): void => {
    untrack(() => updater(this.#root));
  };
}

describe('Spike 022 — version-bridge singleton as a class', () => {
  it('reactivity survives the bare getter: a $derived off instance.dataRoot recomputes after setDataRoot mutates', () => {
    let ctx!: DataContext;
    const recorded: Array<number> = [];

    const cleanup = $effect.root(() => {
      ctx = new DataContext();
      const len = $derived(ctx.dataRoot.electionData.length);
      $effect(() => {
        recorded.push(len);
      });
    });
    flushSync();
    expect(recorded.at(-1)).toBe(0);

    ctx.setDataRoot((dr) => dr.update(() => dr.provideElectionData([1, 2, 3])));
    flushSync();
    expect(recorded.at(-1)).toBe(3); // bridged through the class getter
    cleanup();
  });

  it('no loop: a producer $effect calling setDataRoot runs once (the setter internalizes untrack)', () => {
    let producerRuns = 0;

    const run = () => {
      const cleanup = $effect.root(() => {
        const ctx = new DataContext();
        let trigger = $state(0);
        $effect(() => {
          void trigger;
          producerRuns++;
          ctx.setDataRoot((dr) => dr.update(() => dr.provideElectionData([trigger])));
        });
      });
      flushSync();
      cleanup();
    };

    expect(run).not.toThrow();
    expect(producerRuns).toBe(1);
  });

  it('contrast: a producer reading the reactive getter then mutating SELF-PERPETUATES (unbounded re-runs) — proving the untrack/setter path is load-bearing', () => {
    // NOTE vs Spike 017: there the identical loop tripped Svelte's synchronous
    // `effect_update_depth_exceeded` guard. With a class PRIVATE `#version` $state
    // field the re-runs reschedule across flush cycles rather than synchronously,
    // so the depth-guard does NOT fire — the loop just spins (it timed out at 5s
    // before this cap was added). We make the hazard deterministic by capping the
    // mutation and asserting the effect re-ran far more than the setter path's once.
    const CAP = 30;
    let runs = 0;

    const cleanup = $effect.root(() => {
      const ctx = new DataContext();
      $effect(() => {
        const dr = ctx.dataRoot; // read reactive getter → takes a dep on #version
        runs++;
        if (runs <= CAP) {
          // mutate → subscribe → #version++ → invalidates THIS effect → re-run …
          dr.update(() => dr.provideElectionData([runs]));
        }
      });
    });
    flushSync();
    cleanup();

    // The reactive-read producer re-ran until the cap stopped it (unbounded).
    // The setter path (previous test) ran exactly once under the same load.
    expect(runs).toBeGreaterThan(CAP); // ran CAP times mutating + at least one more
  });

  it('setDataRoot survives DETACH (arrow field keeps `this`)', () => {
    let ctx!: DataContext;
    const recorded: Array<number> = [];

    const cleanup = $effect.root(() => {
      ctx = new DataContext();
      const len = $derived(ctx.dataRoot.electionData.length);
      $effect(() => {
        recorded.push(len);
      });
    });
    flushSync();

    const { setDataRoot } = ctx; // detach the writer
    setDataRoot((dr) => dr.update(() => dr.provideElectionData([9, 9])));
    flushSync();
    expect(recorded.at(-1)).toBe(2);
    cleanup();
  });
});
