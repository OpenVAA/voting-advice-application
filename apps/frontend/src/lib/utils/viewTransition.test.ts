import { afterEach, describe, expect, it, vi } from 'vitest';
import { isOverlayNavigation, shouldAnimate, startViewTransition, VT_NO_NAMES_CLASS } from './viewTransition';
import type { NavigationTarget } from '@sveltejs/kit';

// Svelte's `MediaQuery` reads `matchMedia` once at module load, and jsdom has none, so the reduced-motion query is replaced by an object whose `current` each test sets.
const reducedMotion = vi.hoisted(() => ({ current: false }));
vi.mock('svelte/motion', () => ({ prefersReducedMotion: reducedMotion }));

/**
 * Specification for the overlay exemption that keeps document View Transitions off the results entity drawer.
 *
 * The case that matters is the pair at the top of the table: a navigation with the overlay params on ONE end only. That is what opening and closing the drawer look like, and it is the whole reason the predicate ORs its two ends rather than comparing them — a document VT run across either edge paints every named group above the top-layer dialog, so the page under the drawer is drawn on top of it for the duration and the header flashes over the backdrop (see spike 031).
 *
 * The two `false` rows below are not padding. `entity` without `id` is the shape the leaf `+page.ts` redirects on (307), and `id` without `entity` is the matcher-fallthrough shape; both are ordinary list navigations that SHOULD animate, and a predicate keyed on "either param present" would wrongly suppress the transition on both.
 *
 * ⚠ ASSUMPTION, pinned here but not detectable here: the results entity drawer is the ONLY routed overlay in the application, which is what makes `entity` + `id` a sufficient key for "this navigation opens or closes an overlay". A second routed overlay would force the predicate to generalise — to a route-id allowlist, or to an overlay flag on the route's data — and these rows would keep passing while the new overlay transitioned over its own dialog. This table can hold the assumption still; it cannot notice one being broken.
 */
// Array-of-arrays + %s positional tokens is the repo's house style for table-driven specs, and it dissolves the quoted-object title that an object-shaped table would render.
type Target = Pick<NavigationTarget, 'params'> | null;

const CASES: Array<[string, Target, Target, boolean]> = [
  [
    'closing the drawer — both params on `from`, none on `to`',
    { params: { entity: 'candidate', id: 'c-1' } },
    { params: {} },
    true
  ],
  [
    'opening the drawer — none on `from`, both on `to`',
    { params: {} },
    { params: { entity: 'candidate', id: 'c-1' } },
    true
  ],
  [
    'only the entity param — the leaf guard 307 shape, not an overlay',
    { params: {} },
    { params: { entity: 'candidate' } },
    false
  ],
  [
    'only the id param — the matcher-fallthrough shape, not an overlay',
    { params: {} },
    { params: { id: 'c-1' } },
    false
  ],
  ['both ends null — a first load, not an overlay', null, null, false]
];

describe('isOverlayNavigation', () => {
  it.each(CASES)('%s → %s', (_label, from, to, expected) => {
    expect(
      isOverlayNavigation(from, to),
      expected
        ? 'a navigation that opens or closes the drawer must be exempted from the document VT, or named groups paint above the top-layer dialog'
        : 'an ordinary list navigation must keep its document VT; suppressing it here would silently remove the results page transition'
    ).toBe(expected);
  });
});

describe('shouldAnimate', () => {
  afterEach(() => {
    Reflect.deleteProperty(document, 'startViewTransition');
    reducedMotion.current = false;
  });

  function stubSupport(): void {
    Object.defineProperty(document, 'startViewTransition', { value: vi.fn(), configurable: true });
  }

  it('animates where View Transitions are supported and motion is allowed', () => {
    stubSupport();
    expect(shouldAnimate(new URL('http://localhost/results'))).toBe(true);
  });

  it('does not animate when the user prefers reduced motion', () => {
    stubSupport();
    reducedMotion.current = true;
    expect(shouldAnimate(new URL('http://localhost/results'))).toBe(false);
  });

  it('does not animate with the notr escape hatch', () => {
    stubSupport();
    expect(shouldAnimate(new URL('http://localhost/results?notr=1'))).toBe(false);
  });
});

describe('startViewTransition', () => {
  afterEach(() => {
    Reflect.deleteProperty(document, 'startViewTransition');
    document.documentElement.classList.remove(VT_NO_NAMES_CLASS);
    document.body.innerHTML = '';
  });

  function stubTransition(finished: Promise<void>): void {
    const start = vi.fn((callback: () => void) => {
      callback();
      return { finished, ready: Promise.resolve(), updateCallbackDone: Promise.resolve(), skipTransition: vi.fn() };
    });
    Object.defineProperty(document, 'startViewTransition', { value: start, configurable: true });
  }

  it('removes the name-strip class when the transition finishes', async () => {
    document.body.innerHTML = '<dialog open></dialog>';
    stubTransition(Promise.resolve());
    startViewTransition(() => undefined);
    expect(document.documentElement.classList.contains(VT_NO_NAMES_CLASS)).toBe(true);
    await Promise.resolve();
    await Promise.resolve();
    expect(document.documentElement.classList.contains(VT_NO_NAMES_CLASS)).toBe(false);
  });

  it('removes the class without an unhandled rejection when the transition is skipped', async () => {
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);
    try {
      document.body.innerHTML = '<dialog open></dialog>';
      stubTransition(Promise.reject(new DOMException('Transition was skipped', 'AbortError')));
      startViewTransition(() => undefined);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(document.documentElement.classList.contains(VT_NO_NAMES_CLASS)).toBe(false);
      expect(unhandled).not.toHaveBeenCalled();
    } finally {
      process.off('unhandledRejection', unhandled);
    }
  });
});
