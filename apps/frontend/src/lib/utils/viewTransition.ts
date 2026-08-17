/**
 * Shared View-Transitions helpers.
 *
 * Houses the single `shouldAnimate()` gate + a typed `startViewTransition`
 * guard consumed by both the root layout (`routes/+layout.svelte`) and the
 * entity-detail Tabs local wrapper (Plan 02), so the View-Transitions
 * mechanism has one implementation.
 *
 * - `shouldAnimate` short-circuits on SSR, missing browser support,
 *   `prefers-reduced-motion: reduce` (VT-03 JS layer), and the `?notr=1`
 *   escape hatch (decision 99-2).
 * - `startViewTransition` is a thin wrapper around the browser-native
 *   `document.startViewTransition`, using the built-in `lib.dom.d.ts`
 *   `ViewTransition` type (TS 5.9.3) so no local interface is hand-rolled and
 *   no `any` is needed (CLAUDE.md TS-strict rule).
 */

/**
 * Returns whether a navigation to `destUrl` should play a View Transition.
 *
 * False when: rendered on the server, the browser lacks
 * `document.startViewTransition`, the user prefers reduced motion, or the
 * destination URL carries the `?notr=1` escape hatch.
 */
export function shouldAnimate(destUrl: URL | undefined): boolean {
  if (typeof document === 'undefined') return false;
  if (!('startViewTransition' in document)) return false;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
  if (destUrl?.searchParams.get('notr') === '1') return false;
  return true;
}

/**
 * Thin wrapper around the browser-native `document.startViewTransition`.
 *
 * Returns the `ViewTransition` object, or `undefined` if the API is
 * unavailable. Contains NO reduced-motion / `notr` logic — that gate lives in
 * `shouldAnimate`; this is purely the feature-checked invocation wrapper.
 */
export function startViewTransition(updateCallback: () => void | Promise<void>): ViewTransition | undefined {
  if (typeof document === 'undefined') return undefined;
  if (!('startViewTransition' in document)) return undefined;
  return document.startViewTransition(updateCallback);
}
