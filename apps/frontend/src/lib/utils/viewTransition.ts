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
 *   escape hatch (decision D-02 / 99-2).
 * - `startViewTransition` is a typed wrapper around the browser-native
 *   `document.startViewTransition` (SvelteKit ships no View-Transition type as
 *   of this repo), avoiding `any` per the CLAUDE.md TS-strict rule.
 */

/** Minimal shape of the browser-native View-Transition object. */
interface ViewTransition {
  finished: Promise<void>;
  ready: Promise<void>;
  updateCallbackDone: Promise<void>;
  skipTransition: () => void;
}

/** `Document` augmented with the View-Transitions API (not in the DOM lib here). */
interface DocumentWithViewTransition extends Document {
  startViewTransition: (updateCallback: () => void | Promise<void>) => ViewTransition;
}

/**
 * Returns whether a navigation to `destUrl` should play a View Transition.
 *
 * False when: rendered on the server, the browser lacks
 * `document.startViewTransition`, the user prefers reduced motion, or the
 * destination URL carries the `?notr=1` escape hatch.
 */
export function shouldAnimate(destUrl: URL | undefined): boolean {
  if (typeof document === 'undefined') return false;
  if (!(document as Partial<DocumentWithViewTransition>).startViewTransition) return false;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
  if (destUrl?.searchParams.get('notr') === '1') return false;
  return true;
}

/**
 * Typed wrapper around the browser-native `document.startViewTransition`.
 *
 * Returns the `ViewTransition` object, or `undefined` if the API is
 * unavailable. Contains NO reduced-motion / `notr` logic — that gate lives in
 * `shouldAnimate`; this is purely the typed invocation wrapper.
 */
export function startViewTransition(updateCallback: () => void | Promise<void>): ViewTransition | undefined {
  if (typeof document === 'undefined') return undefined;
  const doc = document as Partial<DocumentWithViewTransition>;
  if (!doc.startViewTransition) return undefined;
  return doc.startViewTransition(updateCallback);
}
