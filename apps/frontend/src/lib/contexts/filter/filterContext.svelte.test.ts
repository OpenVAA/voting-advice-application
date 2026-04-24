import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// Import the test stub directly. The vitest.config alias rewrites `$app/state`
// → `src/lib/i18n/tests/__mocks__/app-state.ts`, so the `page` singleton seen
// by `filterContext.svelte.ts` IS the same object as `mockPage` here.
import { page as mockPage } from '$app/state';
import FilterContextHarness from './__tests__/FilterContextHarness.svelte';
import GetFilterContextHarness from './__tests__/GetFilterContextHarness.svelte';
import type { FilterContext } from './filterContext.type';
import type { FilterTree } from '$lib/contexts/voter/filters/filterStore.svelte';

// Stub @sveltejs/kit error to throw with status + body for assertions.
vi.mock('@sveltejs/kit', () => ({
  error: (status: number, message: string) => {
    const err = new Error(message) as Error & { status: number; body: { message: string } };
    err.status = status;
    err.body = { message };
    throw err;
  }
}));

vi.mock('$lib/utils/logger', () => ({ logDebugError: vi.fn() }));

/**
 * Fake Filter implementing the subset of the @openvaa/filters Filter API used by filterContext.
 * Mirrors the public surface: `name`, `active`, `setRule()`, `reset()`, `onChange(handler, add)`.
 */
class FakeFilter {
  name: string;
  active = false;
  _handlers: Set<(f: unknown) => void> = new Set();
  constructor(name = 'f1') {
    this.name = name;
  }
  onChange(h: (f: unknown) => void, add = true) {
    if (add) this._handlers.add(h);
    else this._handlers.delete(h);
  }
  setRule(_value: unknown) {
    this.active = true;
    this._handlers.forEach((h) => h(this));
  }
  reset() {
    if (!this.active) return;
    this.active = false;
    this._handlers.forEach((h) => h(this));
  }
}

/**
 * Fake FilterGroup with the public API consumed by filterContext.
 * Tracks onChange add/remove via a Set for unsubscribe verification.
 */
class FakeGroup {
  filters: Array<FakeFilter>;
  _handlers: Set<(g: unknown) => void> = new Set();
  // Spy aids: counts of add/remove for cleanup assertions
  addCount = 0;
  removeCount = 0;
  constructor(filters: Array<FakeFilter>) {
    this.filters = filters;
    // Wire each filter's onChange to bubble up to the group's handlers (mirrors real FilterGroup ctor)
    filters.forEach((f) => f.onChange(() => this._handlers.forEach((h) => h(this))));
  }
  apply<T>(targets: Array<T>): Array<T> {
    return this.active ? [] : [...targets];
  }
  get active() {
    return this.filters.some((f) => f.active);
  }
  reset() {
    this.filters.forEach((f) => (f.active = false));
    this._handlers.forEach((h) => h(this));
  }
  onChange(h: (g: unknown) => void, add = true) {
    if (add) {
      this._handlers.add(h);
      this.addCount++;
    } else {
      this._handlers.delete(h);
      this.removeCount++;
    }
  }
}

/** Make a fresh DOM target div for `mount()`. */
function mountTarget(): HTMLElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

describe('filterContext', () => {
  beforeEach(() => {
    // Reset the page-state stub between tests (the stub is a module singleton
    // — the alias means the same object is shared across tests).
    mockPage.params = {};
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('getFilterContext() before initFilterContext() throws status-500 error', () => {
    let caught: (Error & { status?: number }) | undefined;
    const target = mountTarget();
    const component = mount(GetFilterContextHarness, {
      target,
      props: {
        onError: (e) => {
          caught = e as Error & { status?: number };
        }
      }
    });
    flushSync();
    unmount(component);
    expect(caught).toBeDefined();
    expect(caught!.message).toMatch(/called before init/i);
    expect(caught!.status).toBe(500);
  });

  it('initFilterContext() returns a context; calling it twice throws status-500', () => {
    const tree = {} as unknown as FilterTree;
    let firstCtx: FilterContext | undefined;
    let secondErr: (Error & { status?: number }) | undefined;
    const target = mountTarget();
    const component = mount(FilterContextHarness, {
      target,
      props: {
        init: { entityFilters: () => tree },
        initSecond: true,
        onReady: (c) => {
          firstCtx = c;
        },
        onSecondInitError: (e) => {
          secondErr = e as Error & { status?: number };
        }
      }
    });
    flushSync();
    unmount(component);
    expect(firstCtx).toBeDefined();
    expect(secondErr).toBeDefined();
    expect(secondErr!.message).toMatch(/called for a second time/i);
    expect(secondErr!.status).toBe(500);
  });

  it('exposes the FilterGroup scoped by (electionId, entityTypePlural=candidates → candidate)', () => {
    const candidateGroup = new FakeGroup([new FakeFilter('cand-f')]);
    const orgGroup = new FakeGroup([new FakeFilter('org-f')]);
    const tree = { e1: { candidate: candidateGroup, organization: orgGroup } } as unknown as FilterTree;
    mockPage.params = { electionId: 'e1', entityTypePlural: 'candidates' };

    let observed: unknown;
    const target = mountTarget();
    const component = mount(FilterContextHarness, {
      target,
      props: {
        init: { entityFilters: () => tree },
        onReady: (ctx) => {
          observed = ctx.filterGroup;
        }
      }
    });
    flushSync();
    unmount(component);
    expect(observed).toBe(candidateGroup);
  });

  it('changing entityTypePlural to organizations resolves to the organization FilterGroup', () => {
    const candidateGroup = new FakeGroup([new FakeFilter('c')]);
    const orgGroup = new FakeGroup([new FakeFilter('o')]);
    const tree = { e1: { candidate: candidateGroup, organization: orgGroup } } as unknown as FilterTree;

    mockPage.params = { electionId: 'e1', entityTypePlural: 'organizations' };
    let observed: unknown;
    const target = mountTarget();
    const component = mount(FilterContextHarness, {
      target,
      props: {
        init: { entityFilters: () => tree },
        onReady: (ctx) => {
          observed = ctx.filterGroup;
        }
      }
    });
    flushSync();
    unmount(component);
    expect(observed).toBe(orgGroup);
  });

  it('mutating a filter rule bumps the version counter so $derived consumers re-run', () => {
    const f1 = new FakeFilter('f1');
    const group = new FakeGroup([f1]);
    const tree = { e1: { candidate: group } } as unknown as FilterTree;
    mockPage.params = { electionId: 'e1', entityTypePlural: 'candidates' };

    let captured: FilterContext | undefined;
    const target = mountTarget();
    const component = mount(FilterContextHarness, {
      target,
      props: {
        init: { entityFilters: () => tree },
        onReady: (ctx) => {
          captured = ctx;
        }
      }
    });
    flushSync();
    expect(captured).toBeDefined();
    const initialVersion = captured!.version;

    // Touch filterGroup to activate the $effect (which attaches the onChange handler).
    void captured!.filterGroup;
    flushSync();
    // The $effect should have attached. Now mutate a filter rule.
    f1.setRule({ kind: 'whatever' });
    flushSync();
    const bumpedVersion = captured!.version;

    unmount(component);
    expect(initialVersion).toBe(0);
    expect(bumpedVersion).toBe(1);
  });

  it('resetFilters() invokes FilterGroup.reset() on the active group', () => {
    const f1 = new FakeFilter('f1');
    const group = new FakeGroup([f1]);
    const resetSpy = vi.spyOn(group, 'reset');
    const tree = { e1: { candidate: group } } as unknown as FilterTree;
    mockPage.params = { electionId: 'e1', entityTypePlural: 'candidates' };

    let captured: FilterContext | undefined;
    const target = mountTarget();
    const component = mount(FilterContextHarness, {
      target,
      props: {
        init: { entityFilters: () => tree },
        onReady: (ctx) => {
          captured = ctx;
        }
      }
    });
    flushSync();
    void captured!.filterGroup;
    flushSync();
    captured!.resetFilters();
    flushSync();
    unmount(component);
    expect(resetSpy).toHaveBeenCalledTimes(1);
  });

  it('removes the onChange listener on unmount (Pitfall 2 cleanup)', () => {
    const oldGroup = new FakeGroup([new FakeFilter('old')]);
    const tree = { e1: { candidate: oldGroup } } as unknown as FilterTree;
    mockPage.params = { electionId: 'e1', entityTypePlural: 'candidates' };

    const target = mountTarget();
    const component = mount(FilterContextHarness, {
      target,
      props: {
        init: { entityFilters: () => tree },
        onReady: (ctx) => {
          // touch to activate the $effect
          void ctx.filterGroup;
        }
      }
    });
    flushSync();
    expect(oldGroup.addCount).toBeGreaterThanOrEqual(1);
    expect(oldGroup._handlers.size).toBeGreaterThanOrEqual(1);
    unmount(component);
    flushSync();
    // After unmount, the cleanup return MUST detach the handler.
    expect(oldGroup._handlers.size).toBe(0);
    expect(oldGroup.removeCount).toBeGreaterThanOrEqual(1);
  });

  it('returns undefined for filterGroup when scope params are incomplete', () => {
    const tree = {
      e1: { candidate: new FakeGroup([new FakeFilter()]) }
    } as unknown as FilterTree;
    // No electionId, no entityTypePlural
    mockPage.params = {};
    let observed: unknown = 'sentinel';
    const target = mountTarget();
    const component = mount(FilterContextHarness, {
      target,
      props: {
        init: { entityFilters: () => tree },
        onReady: (ctx) => {
          observed = ctx.filterGroup;
        }
      }
    });
    flushSync();
    unmount(component);
    expect(observed).toBeUndefined();
  });
});
