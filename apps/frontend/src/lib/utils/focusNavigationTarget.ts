/**
 * Post-navigation focus reset (NAVA11Y-02, the global half), consumed by the root layout's `afterNavigate`.
 *
 * After a navigation, focus moves to the page's `[data-focus-on-nav]` element, or to its first `<h1>` when no such element exists, so a screen-reader user lands on the new page's heading instead of on whatever the previous page left focused.
 *
 * ⚠ THE TARGET MAY NOT EXIST YET WHEN THE FIRST FRAME RUNS, AND A ONE-SHOT LOOKUP THEN FOCUSES NOTHING, FOREVER. The voter question heading is rendered client-side after an async gap (lazily imported modules), so on a slow device or a loaded host a frame can paint between `afterNavigate` and the heading's render. The previous one-shot form looked once, found nothing, and left focus on `<body>`: reproduced by delaying only the icon-module fetches by 1.5 s (the frame ran at 392 ms with no heading, the heading rendered at 398 ms, and `focus()` was never called). So when the first frame finds no target, this waits for one to appear, bounded by a timeout and cancelled by the next navigation.
 *
 * IT NEVER TAKES FOCUS BACK FROM THE USER. If focus moves while the target is still pending -- the user tabbed, or a control autofocused -- the wait is abandoned rather than overriding that move.
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
  }

  function findTarget(): HTMLElement | null {
    return doc.querySelector<HTMLElement>(FOCUS_ON_NAV_SELECTOR) ?? doc.querySelector<HTMLElement>('h1');
  }

  function focusIfPresent(): boolean {
    const target = findTarget();
    if (!target) return false;
    cancel();
    // `preventScroll: true` is MANDATORY: real `goto({ noScroll })` callsites exist, and scrolling to the heading would fight them.
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
    timer = setTimeout(cancel, timeoutMs);
  });

  return cancel;
}
