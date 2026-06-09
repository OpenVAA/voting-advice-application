import { flushSync, untrack } from 'svelte';
import { describe, expect, it } from 'vitest';

/**
 * SPIKE 017 — read/write split eliminates the `{ current, instance }` handle.
 *
 * Production shape (apps/frontend/src/lib/contexts/data/dataContext.svelte.ts):
 *   - `version` $state, bumped (untracked) inside `dataRoot.subscribe(...)`.
 *   - exposed as `{ get current() { void version; return dataRoot }, get instance() { return dataRoot } }`.
 *   - consumers read `.current` (reactive); producers read `.instance` (non-reactive)
 *     to avoid taking a read-dep on `version` and looping (Spike 002 / CONVENTIONS §2,§3).
 *
 * Production producer call site (+layout.svelte:115-132) is belt-AND-braces — it
 * uses BOTH `.instance` AND wraps the write in `untrack(...)`. Either alone breaks
 * the loop. THIS SPIKE's hypothesis: a `setDataRoot(updater)` that internalizes the
 * `untrack` makes the public `.instance` READ handle redundant, leaving a clean
 * read/write split: bare reactive `get dataRoot()` + `setDataRoot(updater)`.
 *
 * We model only DataRoot's reactive-relevant contract (stable identity + imperative
 * subscribe() + a mutating provide* that notifies). The data semantics are
 * irrelevant to the reactive-graph fact under test.
 */

/** Minimal faithful model of @openvaa/data's DataRoot reactive contract. */
class FakeDataRoot {
  electionData: Array<number> = [];
  #subs = new Set<() => void>();
  subscribe(cb: () => void): () => void {
    this.#subs.add(cb);
    return () => this.#subs.delete(cb);
  }
  /** Transactional mutation: run `fn`, then notify subscribers once (DataRoot.update). */
  update(fn: () => void): void {
    fn();
    this.#subs.forEach((cb) => cb());
  }
  provideElectionData(d: Array<number>): void {
    this.electionData = d;
  }
}

// ── Shape A: PROPOSED read/write split (no `.instance`) ────────────────────
function makeSplitDataContext() {
  const root = new FakeDataRoot();
  let version = $state(0);
  // subscribe → bump version. untracked (Pattern §3) so a notify firing inside a
  // tracked scope can't retrigger that scope through the version write itself.
  root.subscribe(() => {
    untrack(() => {
      version++;
    });
  });
  return {
    // READ concern — bare reactive getter (the `readonly foo` the user proposed,
    // internally version-gated). Consumers read `ctx.dataRoot` (no `.current`).
    get dataRoot(): FakeDataRoot {
      void version;
      return root;
    },
    // WRITE concern — encapsulates the NON-REACTIVE write path. The internal
    // `untrack` is what the production producer wrote by hand at the call site;
    // pulling it in here is what lets us delete the public `.instance` handle.
    setDataRoot(updater: (dr: FakeDataRoot) => void): void {
      untrack(() => updater(root));
    }
  };
}

// ── Shape B: STATUS-QUO, but producer (deliberately) reads the REACTIVE getter ──
// Models the loop the `.instance` handle exists to prevent. Used only to prove the
// hazard is real and that the split (Shape A) is what removes it.
function makeReactiveOnlyDataContext() {
  const root = new FakeDataRoot();
  let version = $state(0);
  root.subscribe(() => {
    untrack(() => {
      version++;
    });
  });
  return {
    get current(): FakeDataRoot {
      void version;
      return root;
    }
  };
}

describe('Spike 017 — read/write split eliminates { current, instance }', () => {
  it('reactivity survives the bare getter: a $derived off ctx.dataRoot recomputes after setDataRoot mutates', () => {
    let ctx!: ReturnType<typeof makeSplitDataContext>;
    const recorded: Array<number> = [];

    const cleanup = $effect.root(() => {
      ctx = makeSplitDataContext();
      const len = $derived(ctx.dataRoot.electionData.length);
      $effect(() => {
        recorded.push(len);
      });
    });
    flushSync();

    expect(recorded.at(-1)).toBe(0); // initial

    // WRITE through the split setter — no `.instance`, no hand-written untrack.
    ctx.setDataRoot((dr) => dr.update(() => dr.provideElectionData([1, 2, 3])));
    flushSync();

    expect(recorded.at(-1)).toBe(3); // bare getter propagated the update
    cleanup();
  });

  it('no loop: a PRODUCER $effect calling setDataRoot does NOT trigger effect_update_depth_exceeded — and needs no .instance', () => {
    let producerRuns = 0;

    const run = () => {
      const cleanup = $effect.root(() => {
        const ctx = makeSplitDataContext();
        let trigger = $state(0);
        $effect(() => {
          void trigger; // producer depends on a reactive input (page.data analog)
          producerRuns++;
          // Mutate via the split setter. Because the setter never reads `version`,
          // this effect takes NO dependency on the version counter → no self-loop.
          ctx.setDataRoot((dr) => dr.update(() => dr.provideElectionData([trigger])));
        });
      });
      flushSync();
      cleanup();
    };

    expect(run).not.toThrow();
    expect(producerRuns).toBe(1); // ran once; the setter's mutation did not retrigger it
  });

  it('contrast: the SAME producer reading the reactive getter (no split) DOES loop — proving why .instance/untrack was required', () => {
    const run = () => {
      const cleanup = $effect.root(() => {
        const ctx = makeReactiveOnlyDataContext();
        $effect(() => {
          // Reads the reactive `.current` (→ version) THEN mutates → version++ →
          // re-runs → … This is exactly the trap `.instance` (or the producer's
          // hand-written untrack) was introduced to avoid.
          const dr = ctx.current;
          dr.update(() => dr.provideElectionData([1]));
        });
      });
      flushSync();
      cleanup();
    };

    expect(run).toThrow(/effect_update_depth_exceeded/);
  });
});
