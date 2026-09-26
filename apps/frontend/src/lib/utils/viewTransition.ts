/**
 * Shared View-Transitions helpers.
 *
 * Houses the single `shouldAnimate()` gate + a typed `startViewTransition` guard consumed by both the root layout (`routes/+layout.svelte`) and the entity-detail Tabs local wrapper, so the View-Transitions mechanism has one implementation.
 *
 * - `shouldAnimate` short-circuits on SSR, missing browser support,
 *   `prefers-reduced-motion: reduce` (the JS half of the reduced-motion gate; the CSS half lives in the stylesheet), and the `?notr=1` escape hatch.
 * - `isOverlayNavigation` exempts navigations that open or close a modal overlay (the results entity drawer) from the document VT.
 * - `startViewTransition` is a thin wrapper around the browser-native
 *   `document.startViewTransition`, using the built-in `lib.dom.d.ts` `ViewTransition` type (TS 5.9.3) so no local interface is hand-rolled and no `any` is needed (CLAUDE.md TS-strict rule).
 *
 * ⚠ DOCUMENT VIEW TRANSITIONS AND MODAL `<dialog>`S DO NOT MIX. A modal dialog lives in the top layer, which a document VT captures as part of the `root` snapshot. Every element with a `view-transition-name` (`persistent-header`, `main-content`, …) becomes its own group painted ABOVE `root` — so for the duration of the transition the page under the dialog is drawn on top of it (spike 031: the header flashes over the backdrop; the results list covers the drawer during a drawer-tab switch). Hence the two rules below: overlay navigations get no document VT at all, and a VT that runs while a modal is open runs with every name stripped.
 */

/** Class set on `<html>` for the duration of a VT that must run without named groups. The matching rule lives in the root layout stylesheet (`routes/+layout.svelte`), and its `!important` is load-bearing — the named elements carry their names as inline `style` attributes. */
export const VT_NO_NAMES_CLASS = 'vt-no-names';

/**
 * Returns whether a navigation to `destUrl` should play a View Transition.
 *
 * False when: rendered on the server, the browser lacks `document.startViewTransition`, the user prefers reduced motion, or the destination URL carries the `?notr=1` escape hatch.
 */
export function shouldAnimate(destUrl: URL | undefined): boolean {
  if (typeof document === 'undefined') return false;
  if (!('startViewTransition' in document)) return false;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
  if (destUrl?.searchParams.get('notr') === '1') return false;
  return true;
}

/** The part of a SvelteKit `NavigationTarget` this module reads. Deliberately minimal: the predicate below needs nothing but the route params, so callers — and tests — need no SvelteKit navigation object to satisfy it. */
export interface NavigationEnd {
  params: Record<string, string | undefined> | null;
}

/**
 * Whether a navigation opens or closes a modal overlay — the results entity drawer, whose URL carries both `entity` and `id` params. Such navigations must not run a document VT (see the module doc); the overlay's own open/close motion is the transition.
 *
 * ⚠ ASSUMPTION: the results entity drawer is the ONLY routed overlay in the application, which is what makes `entity` + `id` a sufficient key. A second routed overlay — a routed question-info dialog, a routed comparison sheet — would force this predicate to generalise (a route-id allowlist, or an overlay flag on the route's data). `viewTransition.test.ts` pins the contract but cannot detect a new overlay being added; that is a review obligation, not a testable one.
 */
export function isOverlayNavigation(from: NavigationEnd | null, to: NavigationEnd | null): boolean {
  return hasOverlay(from) || hasOverlay(to);
}

function hasOverlay(end: NavigationEnd | null): boolean {
  return !!(end?.params?.entity && end.params.id);
}

/**
 * Thin wrapper around the browser-native `document.startViewTransition`.
 *
 * Returns the `ViewTransition` object, or `undefined` if the API is unavailable. Contains NO reduced-motion / `notr` logic — that gate lives in `shouldAnimate`. When a modal dialog is open, the transition runs with all `view-transition-name`s stripped (see the module doc), so the whole viewport — dialog included — cross-fades as one `root` image.
 */
export function startViewTransition(updateCallback: () => void | Promise<void>): ViewTransition | undefined {
  if (typeof document === 'undefined') return undefined;
  if (!('startViewTransition' in document)) return undefined;
  const root = document.documentElement;
  const stripNames = !!document.querySelector('dialog[open]');
  if (stripNames) root.classList.add(VT_NO_NAMES_CLASS);
  const transition = document.startViewTransition(updateCallback);
  transition.finished.finally(() => root.classList.remove(VT_NO_NAMES_CLASS));
  return transition;
}
