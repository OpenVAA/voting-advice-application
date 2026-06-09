import { flushSync } from 'svelte';
import { describe, expect, it } from 'vitest';

/**
 * SPIKE 019 — does the read/write split eliminate the destructure trap?
 *
 * The user's proposed read side is `readonly foo` (a bare getter, internally a
 * `$derived`). This spike bounds the claim: the destructure trap (CLAUDE.md
 * "Context Destructuring Rule") is a property of GETTER-BASED reads + JS
 * destructuring — it is INDEPENDENT of the write concern. Splitting reads from
 * writes does nothing to it.
 *
 * The sharper, non-obvious finding under test: the BARE-getter shape the proposal
 * asks for is precisely the shape that HAS the trap, whereas the `{ current }`
 * handle it replaces is incidentally a trap FIREWALL — `const { foo } = ctx`
 * destructures the stable handle OBJECT, and a later `foo.current` re-invokes the
 * getter inside the tracking scope. Dropping `.current` removes that firewall.
 */

// ── Bare read/write split (the proposed shape): `get foo()` + `setFoo(updater)` ──
function makeBareSplitContext() {
  let source = $state(0);
  const doubled = $derived(source * 2);
  return {
    // READ — `readonly foo`, internally a $derived (exactly the user's proposal).
    get foo(): number {
      return doubled;
    },
    // WRITE — orthogonal to the trap. Present here to show it changes nothing.
    setFoo(updater: (n: number) => number): void {
      source = updater(source);
    }
  };
}

// ── Status-quo `{ current }` handle exposure (the shape Phase 103 folds AWAY) ──
function makeHandleContext() {
  let source = $state(0);
  const doubled = $derived(source * 2);
  return {
    // The `foo` property is a STABLE object; the getter lives on `.current`.
    foo: {
      get current(): number {
        return doubled;
      }
    },
    setFoo(updater: (n: number) => number): void {
      source = updater(source);
    }
  };
}

describe('Spike 019 — read/write split does NOT eliminate the destructure trap', () => {
  it('BARE getter + destructure → TRAP: `const { foo } = ctx` snapshots; `ctx.foo` stays reactive', () => {
    let ctx!: ReturnType<typeof makeBareSplitContext>;
    const recordedDestructured: Array<number> = [];
    const recordedDirect: Array<number> = [];

    const cleanup = $effect.root(() => {
      ctx = makeBareSplitContext();
      // The trap: invokes the getter ONCE, binds the captured value (0) to a const.
      const { foo } = ctx;
      $effect(() => {
        recordedDestructured.push(foo); // reads a frozen const — no reactive dep
      });
      $effect(() => {
        recordedDirect.push(ctx.foo); // re-invokes the getter in scope — reactive
      });
    });
    flushSync();
    expect(recordedDestructured.at(-1)).toBe(0);
    expect(recordedDirect.at(-1)).toBe(0);

    // The write side fires correctly — but it cannot rescue the destructured read.
    ctx.setFoo((n) => n + 5); // source 0 → 5, doubled → 10
    flushSync();

    expect(recordedDirect.at(-1)).toBe(10); // direct ctx.foo read updated
    expect(recordedDestructured.at(-1)).toBe(0); // TRAP: destructured value is stale
    cleanup();
  });

  it('`{ current }` handle + destructure → SAFE: destructuring the stable handle keeps `foo.current` reactive (the firewall the fold removes)', () => {
    let ctx!: ReturnType<typeof makeHandleContext>;
    const recorded: Array<number> = [];

    const cleanup = $effect.root(() => {
      ctx = makeHandleContext();
      // Destructures the STABLE handle object (not a value) — no snapshot of the
      // reactive read. `foo.current` is still a getter invoked in the tracking scope.
      const { foo } = ctx;
      $effect(() => {
        recorded.push(foo.current);
      });
    });
    flushSync();
    expect(recorded.at(-1)).toBe(0);

    ctx.setFoo((n) => n + 5);
    flushSync();

    expect(recorded.at(-1)).toBe(10); // reactive THROUGH the destructure — firewall intact
    cleanup();
  });

  it('the only trap-free read of the bare shape is the NON-destructured `ctx.foo` (CLAUDE.md Context Destructuring Rule, unchanged)', () => {
    let ctx!: ReturnType<typeof makeBareSplitContext>;
    const viaDerived: Array<number> = [];

    const cleanup = $effect.root(() => {
      ctx = makeBareSplitContext();
      // The prescribed safe pattern: alias through $derived(ctx.foo), never destructure.
      const aliased = $derived(ctx.foo);
      $effect(() => {
        viaDerived.push(aliased);
      });
    });
    flushSync();
    expect(viaDerived.at(-1)).toBe(0);

    ctx.setFoo((n) => n + 3); // → doubled 6
    flushSync();

    expect(viaDerived.at(-1)).toBe(6); // reactive — but only because it was NOT destructured
    cleanup();
  });
});
