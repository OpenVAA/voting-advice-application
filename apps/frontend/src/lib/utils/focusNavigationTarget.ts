/**
 * Post-navigation focus reset, called from the root layout's `afterNavigate`.
 *
 * After a navigation, focus moves to the page's `[data-focus-on-nav]` element, or to its first `<h1>` when there is none, so a screen-reader user lands on the new page's heading rather than on whatever the previous page left focused.
 *
 * The target may render after the first frame (the voter question heading waits for lazily imported modules), so when the first lookup finds nothing this waits for the target to appear, bounded by a timeout and cancelled by the next navigation.
 *
 * It never takes focus from the user: a focus move or a pointer press while the target is pending cancels the wait.
 */

/** How long a navigation waits for its focus target to render before giving up, in milliseconds. */
export const FOCUS_TARGET_WAIT_MS = 10_000;

/** The selector for the element a page nominates as its post-navigation focus target. */
export const FOCUS_ON_NAV_SELECTOR = '[data-focus-on-nav]';

export interface FocusNavigationTargetOptions {
  /** The document to search and observe. Defaults to the global `document`. */
  doc?: Document;
  /** Schedules the first lookup. Defaults to `requestAnimationFrame`, so the lookup runs after the navigation's DOM update has been applied. */
  schedule?: (callback: () => void) => void;
  /** How long to wait for a target that is not yet rendered. Defaults to {@link FOCUS_TARGET_WAIT_MS}. */
  timeoutMs?: number;
}

/**
 * Move focus to the navigation's focus target, waiting for it to render if it does not exist on the first frame.
 *
 * Returns a cancel function. Call it when a newer navigation starts, so a stale wait cannot move focus on the new page.
 */
export function focusNavigationTarget({
  doc = document,
  schedule = (callback) => requestAnimationFrame(() => callback()),
  timeoutMs = FOCUS_TARGET_WAIT_MS
}: FocusNavigationTargetOptions = {}): () => void {
  let cancelled = false;
  let observer: MutationObserver | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function cancel(): void {
    cancelled = true;
    observer?.disconnect();
    observer = undefined;
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    doc.removeEventListener('pointerdown', cancel, { capture: true });
  }

  function findTarget(): HTMLElement | null {
    return doc.querySelector<HTMLElement>(FOCUS_ON_NAV_SELECTOR) ?? doc.querySelector<HTMLElement>('h1');
  }

  function focusIfPresent(): boolean {
    const target = findTarget();
    if (!target) return false;
    cancel();
    // `preventScroll` keeps the scroll position that `goto({ noScroll })` navigations ask for.
    target.focus({ preventScroll: true });
    return true;
  }

  schedule(() => {
    if (cancelled || focusIfPresent()) return;
    const focusedWhenWaitBegan = doc.activeElement;
    observer = new MutationObserver(() => {
      if (cancelled) return;
      if (doc.activeElement !== focusedWhenWaitBegan) {
        cancel();
        return;
      }
      focusIfPresent();
    });
    observer.observe(doc.documentElement, { childList: true, subtree: true });
    // Passive and never stops propagation, so the press reaches every other listener unchanged.
    doc.addEventListener('pointerdown', cancel, { capture: true, passive: true, once: true });
    timer = setTimeout(cancel, timeoutMs);
  });

  return cancel;
}
