import { flushSync } from 'svelte';
import { describe, expect, it } from 'vitest';

/**
 * SPIKE 020 — class-as-context core: Groups A, B, D, E, G + the destructure trap.
 *
 * Question: if each context becomes a `class` with `$state`/`$derived` fields
 * (the documented Svelte 5 idiom — "use classes with $state fields to share
 * reactivity between components, instead of using stores"), which of the audited
 * groups simplify, and what survives?
 *
 * Per Svelte docs ($state#Classes): `$state` lives in class fields; the compiler
 * turns them into getter/setter pairs on the prototype. METHODS lose `this` when
 * detached (`const { reset } = todo`), so the docs prescribe ARROW-FUNCTION class
 * fields (`reset = () => {...}`) for anything passed/destructured as a callback.
 *
 * Medium per CONVENTIONS "Medium shift for reactive-graph FACT spikes": headless
 * `*.svelte.test.ts` + `$effect.root` + `flushSync`. Reactive-graph facts, not feel.
 */

// ── A model context as a class ─────────────────────────────────────────────
interface Settings {
  trackEvents: boolean;
  locale: string;
}

/** A nested "auth" class the parent delegates to (Group G). */
class AuthCtx {
  session = $state<string | null>(null);
  get isAuthenticated(): boolean {
    return this.session !== null;
  }
  // Arrow field: survives `const { login } = auth` (Group E discipline).
  login = (id: string): void => {
    this.session = id;
  };
}

class AppCtx {
  // Group B — primitive $state field.
  appType = $state<'voter' | 'candidate'>('voter');

  // Group A — object $state field, written by WHOLESALE REASSIGNMENT.
  settings = $state<Settings>({ trackEvents: false, locale: 'en' });

  // Group D — $derived class field (read-only projection).
  shouldTrack = $derived.by(() => this.settings.trackEvents && this.appType === 'voter');

  // Group G — delegation to a nested reactive class.
  #auth = new AuthCtx();
  get isAuthenticated(): boolean {
    return this.#auth.isAuthenticated;
  }
  get auth(): AuthCtx {
    return this.#auth;
  }

  // Group E — REGULAR method (the trap shape): `this` is lost when detached.
  setLocaleMethod(locale: string): void {
    this.settings = { ...this.settings, locale };
  }

  // Group E — ARROW field (the prescribed shape): `this` is captured.
  setLocaleArrow = (locale: string): void => {
    this.settings = { ...this.settings, locale };
  };

  // Group A write — wholesale reassignment of the object field.
  enableTracking = (): void => {
    this.settings = { ...this.settings, trackEvents: true };
  };
}

describe('Spike 020 — class context core', () => {
  it('Group A: a WHOLESALE-reassigned object $state FIELD is reactive via instance.x — no { current } handle needed', () => {
    let ctx!: AppCtx;
    const seen: Array<boolean> = [];

    const cleanup = $effect.root(() => {
      ctx = new AppCtx();
      // Read straight off the instance property — the prototype getter tracks.
      const tracking = $derived(ctx.settings.trackEvents);
      $effect(() => {
        seen.push(tracking);
      });
    });
    flushSync();
    expect(seen.at(-1)).toBe(false);

    ctx.enableTracking(); // settings = { ...settings, trackEvents: true } — wholesale swap
    flushSync();

    // The reassignment propagated through a BARE property read. This is the win
    // over a reassigned `let`, which would have required a getter handle.
    expect(seen.at(-1)).toBe(true);
    cleanup();
  });

  it('Group B + D: primitive field drives a $derived field through instance reads', () => {
    let ctx!: AppCtx;
    const seen: Array<boolean> = [];

    const cleanup = $effect.root(() => {
      ctx = new AppCtx();
      const st = $derived(ctx.shouldTrack);
      $effect(() => {
        seen.push(st);
      });
    });
    flushSync();
    expect(seen.at(-1)).toBe(false); // trackEvents:false

    ctx.enableTracking();
    flushSync();
    expect(seen.at(-1)).toBe(true); // now true & appType==='voter'

    ctx.appType = 'candidate'; // primitive field reassignment, read inside $derived
    flushSync();
    expect(seen.at(-1)).toBe(false); // $derived recomputed off the primitive
    cleanup();
  });

  it('Group G: delegation getter forwards a nested class $derived live (no spread-of-context)', () => {
    let ctx!: AppCtx;
    const seen: Array<boolean> = [];

    const cleanup = $effect.root(() => {
      ctx = new AppCtx();
      const authed = $derived(ctx.isAuthenticated);
      $effect(() => {
        seen.push(authed);
      });
    });
    flushSync();
    expect(seen.at(-1)).toBe(false);

    ctx.auth.login('user-1'); // mutate nested class through delegation
    flushSync();
    expect(seen.at(-1)).toBe(true);
    cleanup();
  });

  it('Group E (THE caveat): a detached REGULAR method loses `this` and throws; an ARROW field survives', () => {
    const ctx = new AppCtx();

    // Simulates `const { setLocale } = getContext()` or `onclick={ctx.setLocale}`.
    const detachedMethod = ctx.setLocaleMethod;
    const detachedArrow = ctx.setLocaleArrow;

    // Regular method: `this` is undefined → `this.settings` throws.
    expect(() => detachedMethod('fi')).toThrow(TypeError);

    // Arrow field: `this` was captured at construction → works.
    expect(() => detachedArrow('fi')).not.toThrow();
    expect(ctx.settings.locale).toBe('fi');
  });

  it('Group E corollary: bound through the instance, BOTH spellings work — the hazard is only on DETACH', () => {
    const ctx = new AppCtx();
    ctx.setLocaleMethod('sv'); // called as ctx.method() → `this` is ctx
    expect(ctx.settings.locale).toBe('sv');
  });

  it('019 STILL HOLDS under classes: destructuring a $state FIELD snapshots (the trap survives the class move)', () => {
    let ctx!: AppCtx;

    const cleanup = $effect.root(() => {
      ctx = new AppCtx();
    });
    flushSync();

    // The trap: `settings` field is a prototype getter; destructuring invokes it ONCE.
    const { settings } = ctx;
    expect(settings.trackEvents).toBe(false);

    ctx.enableTracking();
    flushSync();

    // Direct field read sees the update; the destructured local is frozen.
    expect(ctx.settings.trackEvents).toBe(true); //  live
    expect(settings.trackEvents).toBe(false); //  stale snapshot — trap intact
    cleanup();
  });
});
