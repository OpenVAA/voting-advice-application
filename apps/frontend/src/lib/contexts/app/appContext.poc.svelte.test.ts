import { flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AppType } from './appContext.type';
import type { RouteBuilder } from './getRoute.svelte';

// `createDarkMode()` reads `browser` from `$app/environment`; keep it `false`
// (SSR path) so the test is deterministic — `dark` stays at its `$state(false)`
// default and no `matchMedia` listener is registered in the test environment.
vi.mock('$app/environment', () => ({
  browser: false,
  dev: true,
  building: false,
  version: 'test'
}));

// `createGetRoute()` reads `$app/state.page` inside its `$derived.by`. Stub a
// minimal page so the route builder closure can be constructed. We assert the
// FOLD (ctx.getRoute is directly callable), not the URL-building details.
vi.mock('$app/state', () => ({
  page: { params: {}, route: { id: '/' }, url: new URL('http://localhost/') }
}));

// `createGetRoute()`'s closure calls `buildRoute`; stub it to a deterministic
// string so the folded `ctx.getRoute(opts)` call is observable.
vi.mock('$lib/utils/route', () => ({
  buildRoute: vi.fn(() => '/built-route')
}));

/**
 * PoC for the Phase-102 handle idioms (Plan 01 decision-record scope), proving
 * the three locked transforms on a representative appContext slice WITHOUT
 * standing up the full `initAppContext()` Svelte-context wiring:
 *
 *  - read-only fold:   `ctx.darkMode`  (plain getter, no `.current`) reads reactively
 *  - read-write pair:  `ctx.appType` / `ctx.appType = v` round-trips through one `$state`
 *  - getRoute fold:    `ctx.getRoute`  is directly callable (`ctx.getRoute(opts)`)
 *
 * The slice below mirrors the EXACT target idiom shapes the decision record
 * specifies for appContext, backed by the real `createDarkMode()` /
 * `createGetRoute()` factories — it is the minimal faithful construction of the
 * context object's `darkMode`/`appType`/`getRoute` properties.
 *
 * CONTRACT (CLAUDE.md "Context Destructuring Rule"): every accessor is read via
 * `ctx.x` — NO reactive accessor is destructured. Destructuring would capture a
 * snapshot and break the reactive edge; the whole point of the getter idiom is
 * that `ctx.x` re-invokes the getter in the tracking scope.
 */

/**
 * Build the minimal PoC slice of the appContext using the post-migration idiom
 * shapes. Returns the slice object plus a `cleanup` to tear down the `$effect.root`.
 */
async function setupPocSlice(): Promise<{
  ctx: { readonly darkMode: boolean; appType: AppType; readonly getRoute: RouteBuilder };
  cleanup: () => void;
}> {
  const { createDarkMode } = await import('../component/darkMode.svelte');
  const { createGetRoute } = await import('./getRoute.svelte');

  let ctx!: {
    readonly darkMode: boolean;
    appType: AppType;
    readonly getRoute: RouteBuilder;
  };

  const cleanup = $effect.root(() => {
    // Read-only handle (factory keeps the reactive `$state`); exposed as a plain getter.
    const _darkMode = createDarkMode();

    // Read-write handle backed by raw factory `$state` (adminContext.svelte.ts:112-117 shape).
    let _appTypeValue = $state<AppType>(undefined);

    // Derived route builder; only the EXPOSURE folds — producer `$derived.by` untouched.
    const _getRoute = createGetRoute();

    ctx = {
      // Read-only fold: plain getter, no `.current` on the consumer side.
      get darkMode() {
        return _darkMode.current;
      },
      // Read-write accessor pair over the same backing `$state`.
      get appType() {
        return _appTypeValue;
      },
      set appType(v: AppType) {
        _appTypeValue = v;
      },
      // getRoute fold: `ctx.getRoute` is the callable RouteBuilder.
      get getRoute() {
        return _getRoute.current;
      }
    };
  });

  flushSync();
  return { ctx, cleanup };
}

describe('appContext handle-idiom PoC (Phase 102)', () => {
  let cleanup: (() => void) | undefined;

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    vi.restoreAllMocks();
  });

  it('read-write round-trip: ctx.appType = v then ctx.appType === v (single backing $state)', async () => {
    const slice = await setupPocSlice();
    cleanup = slice.cleanup;
    const { ctx } = slice;

    // Initial value (never destructured — read via ctx.appType each time).
    expect(ctx.appType).toBe(undefined);

    ctx.appType = 'voter';
    flushSync();
    expect(ctx.appType).toBe('voter');

    ctx.appType = 'candidate';
    flushSync();
    expect(ctx.appType).toBe('candidate');
  });

  it('read-only reactive read: ctx.darkMode is a plain getter (no .current), reflecting the createDarkMode() backing $state', async () => {
    const slice = await setupPocSlice();
    cleanup = slice.cleanup;
    const { ctx } = slice;

    // Plain getter — `ctx.darkMode`, NOT `ctx.darkMode.current`. SSR path
    // (browser=false) keeps the backing `$state(false)` default.
    expect(typeof ctx.darkMode).toBe('boolean');
    expect(ctx.darkMode).toBe(false);
  });

  it('getRoute fold: ctx.getRoute is directly callable (ctx.getRoute(opts)), not ctx.getRoute.current(opts)', async () => {
    const slice = await setupPocSlice();
    cleanup = slice.cleanup;
    const { ctx } = slice;

    expect(typeof ctx.getRoute).toBe('function');
    // Folded surface: call directly. (buildRoute is stubbed to a fixed string.)
    expect(ctx.getRoute({})).toBe('/built-route');
  });
});
