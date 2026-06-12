import { flushSync } from 'svelte';
import { describe, expect, it } from 'vitest';

/**
 * SPIKE 023 — the SSR hazard ($effect does not run on the server) in the CLASS shape.
 *
 * Svelte docs + CONVENTIONS §7: `$effect` callbacks are registered but NEVER
 * invoked during SSR. So any reactive value that is only POPULATED by an `$effect`
 * is absent from server-rendered HTML — it appears only after the client hydrates
 * and flushes effects (a flash / hydration mismatch). The production appContext
 * merge (appContext.svelte.ts:118-124) carefully does the FIRST merge synchronously
 * at `$state` init and uses `$effect` ONLY for the post-navigation re-merge.
 *
 * This spike re-states that hazard for class contexts and proves the SSR-SAFE class
 * shapes. The rune-level model of "SSR" is: construct + read the field BEFORE any
 * effect flush (effects never flush on the server). After-flush == client hydration.
 *
 * Conclusion the audit needs: when converting a context to a class, the initial
 * value of any merged/derived field MUST come from a synchronous field initializer
 * or a `$derived` field — NEVER from an `$effect`. Classes don't change the rule;
 * they just relocate it into field initializers.
 */

const BASE = { trackEvents: false, locale: 'en' };
const DB = { trackEvents: true }; // the load()/page.data override

function pureMerge<T extends object>(a: T, b: Partial<T>): T {
  const nonNull = Object.fromEntries(Object.entries(b).filter(([, v]) => v != null));
  return { ...a, ...nonNull };
}

// ── SSR-SAFE shape #1: synchronous field initializer (CONVENTIONS §7) ──────
class SyncInitContext {
  // The merge happens in the field initializer → present on the server.
  settings = $state(pureMerge(BASE, DB));
}

// ── SSR-SAFE shape #2: $derived field (correct on read, no effect needed) ──
class DerivedContext {
  #db = $state<Partial<typeof BASE>>(DB);
  settings = $derived.by(() => pureMerge(BASE, this.#db));
}

// ── SSR-BROKEN shape: $effect populates the merge (server renders BASE) ────
class EffectMergeContext {
  settings = $state(BASE); // server-render value
  constructor() {
    // Registered during setup, but NOT invoked on the server. Only a client
    // effect flush will fold in DB.
    $effect(() => {
      this.settings = pureMerge(BASE, DB);
    });
  }
}

describe('Spike 023 — SSR $effect hazard in class contexts', () => {
  it('SSR-SAFE #1: synchronous field initializer yields the merged value BEFORE any flush (server-correct)', () => {
    let serverValue!: typeof BASE;
    const cleanup = $effect.root(() => {
      const ctx = new SyncInitContext();
      serverValue = ctx.settings; // read immediately — models the server render
    });
    // No flushSync() before the read above: the merge was already done at init.
    expect(serverValue.trackEvents).toBe(true);
    cleanup();
  });

  it('SSR-SAFE #2: $derived field computes on read — correct without an effect flush', () => {
    let serverValue!: typeof BASE;
    const cleanup = $effect.root(() => {
      const ctx = new DerivedContext();
      serverValue = ctx.settings; // $derived computes lazily on this read
    });
    expect(serverValue.trackEvents).toBe(true);
    cleanup();
  });

  it('SSR-BROKEN: an $effect-merge field is the BASE value at server-render time; the merge appears only after client flush', () => {
    let serverValue!: typeof BASE;
    let clientValue!: typeof BASE;

    const cleanup = $effect.root(() => {
      const ctx = new EffectMergeContext();
      serverValue = ctx.settings; // BEFORE flush == server render
      flushSync(); // == client hydration flushing effects
      clientValue = ctx.settings;
    });

    expect(serverValue.trackEvents).toBe(false); //  server HTML shows BASE — the bug
    expect(clientValue.trackEvents).toBe(true); // merge only after hydration → flash
    cleanup();
  });

  it('FINDING: a class whose merge lives in $effect cannot even be constructed outside an effect context (factory/SSR scope)', () => {
    // initXxxContext() factories and module scope have NO effect context. A class
    // that calls $effect in its constructor throws effect_orphan there — a hard
    // signal to keep merges in field initializers / $derived, not $effect.
    expect(() => new EffectMergeContext()).toThrow(/effect_orphan/);
  });
});
