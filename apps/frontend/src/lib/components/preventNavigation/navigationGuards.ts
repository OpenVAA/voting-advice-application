import { log } from '@openvaa/app-shared';
import { SvelteSet } from 'svelte/reactivity';
import { goto } from '$app/navigation';
import type { BeforeNavigate } from '@sveltejs/kit';

// A guard registers in `onMount`, which the server never runs, so the server's copy of this module holds no guard and nothing of one visitor reaches another.

/**
 * What a guard of unsaved edits offers something that is about to end the page's state without navigating first.
 */
export interface NavigationGuard {
  /**
   * Whether the page holds something the guard would ask about. It runs inside other components' tracking scopes, also while a navigation is replacing the route, so it must not throw and must not write state.
   */
  isActive(): boolean;
  /** Keep what the page holds, because the user chose to stay. */
  keep(): void;
  /** Let go of what the page holds, because the session that held it has ended. */
  discard(): void;
}

// Reactive, so that a guard registering while something reads `hasActiveNavigationGuard` in a tracking scope reaches that reader.
const guards = new SvelteSet<NavigationGuard>();
let leavingUnasked = false;
/** A navigation {@link holdNavigation} cancelled: where it leads and, for a Back or Forward, the number of history entries it moves. */
interface HeldNavigation {
  href: string;
  delta?: number;
}

// The runs `holdNavigationWhile` is waiting for, and the last navigation held during them.
let holdingRuns = 0;
let heldNavigation: HeldNavigation | undefined;

/**
 * Make a guard known to the functions of this module.
 * @param guard - The guard.
 * @returns The function that removes the guard.
 */
export function registerNavigationGuard(guard: NavigationGuard): () => void {
  guards.add(guard);
  return () => {
    guards.delete(guard);
  };
}

/**
 * Whether a registered guard is active. In a tracking scope the read follows guards that come and go, and what each guard's `isActive` reads.
 * @returns `true` while a guard holds something it would ask about.
 */
export function hasActiveNavigationGuard(): boolean {
  return [...guards].some((guard) => guard.isActive());
}

/**
 * Tell the active guards that the user chose to keep what they hold. Nothing is asked.
 */
export function keepGuardedEdits(): void {
  for (const guard of [...guards]) if (guard.isActive()) guard.keep();
}

/**
 * Tell the active guards to let go of what they hold. Nothing is asked.
 */
export function discardGuardedEdits(): void {
  for (const guard of [...guards]) if (guard.isActive()) guard.discard();
}

/**
 * Make a navigation the user has already agreed to, with the guards asking nothing while it runs.
 * @param navigate - The navigation.
 * @returns A `Promise` settling as the navigation does.
 */
export async function leaveUnasked(navigate: () => Promise<void>): Promise<void> {
  leavingUnasked = true;
  try {
    await navigate();
  } finally {
    leavingUnasked = false;
  }
}

/**
 * Leave the page by a full load of the address. `location.assign` only starts the load, and an engine may fire `beforeunload` after it has returned, so whoever awaits this stands by until the document has gone.
 * @param address - Where to go.
 * @returns A `Promise` that never settles.
 */
export function leaveByFullLoad(address: string): Promise<void> {
  location.assign(address);
  return new Promise<void>(() => undefined);
}

/**
 * Whether a navigation made through {@link leaveUnasked} is running.
 * @returns `true` while it runs.
 */
export function isLeavingUnasked(): boolean {
  return leavingUnasked;
}

/**
 * Hold the application's navigations while a run is pending, such as a sign-out the user asked for: {@link holdNavigation} cancels each one and remembers the last one. When the run rejects, that navigation is followed: a Back or Forward as the same move in the history, with `history.go`, so it leaves no extra entry, and any other with `goto`. Either way it is a fresh navigation with nothing held, and a page's guard asks as it does for any other. When the run resolves, it is dropped.
 * @param run - What the navigations wait for.
 * @returns A `Promise` settling as the run does.
 */
export async function holdNavigationWhile<TResult>(run: () => Promise<TResult>): Promise<TResult> {
  holdingRuns += 1;
  let failed = false;
  try {
    return await run();
  } catch (e) {
    failed = true;
    throw e;
  } finally {
    holdingRuns -= 1;
    if (holdingRuns === 0) {
      const held = heldNavigation;
      heldNavigation = undefined;
      if (failed && held) followHeldNavigation(held);
    }
  }
}

/**
 * Follow a navigation that was held: a traversal with `history.go`, anything else with `goto`.
 * @param held - The navigation.
 */
function followHeldNavigation({ href, delta }: HeldNavigation): void {
  if (delta !== undefined) history.go(delta);
  else goto(href).catch((e) => log.error(`Error following a held navigation: ${(e as Error)?.message}`));
}

/**
 * Whether a run of {@link holdNavigationWhile} is pending.
 * @returns `true` while navigations are held.
 */
export function isNavigationHeld(): boolean {
  return holdingRuns > 0;
}

/**
 * A `beforeNavigate` callback: while navigations are held, cancel a navigation and remember where it leads and, for a Back or Forward (type `popstate`), the number of history entries it moves, which the framework restores when it cancels one. A navigation made through {@link leaveUnasked} and one of type `leave`, which leaves the document, go on.
 * @param navigation - The navigation about to happen.
 */
export function holdNavigation(navigation: Pick<BeforeNavigate, 'type' | 'to' | 'cancel' | 'delta'>): void {
  if (!isNavigationHeld() || leavingUnasked || navigation.type === 'leave') return;
  navigation.cancel();
  if (!navigation.to) return;
  heldNavigation = {
    href: navigation.to.url.href,
    delta: navigation.type === 'popstate' && 'delta' in navigation ? navigation.delta : undefined
  };
}
