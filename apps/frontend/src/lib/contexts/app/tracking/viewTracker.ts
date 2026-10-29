/**
 * One pageview per view: the state of the current view, from its start to the single send of its pageview.
 *
 * A view begins when the caller starts it and is sent at the first flush after that; it is never sent again, whatever sequence of hidden, visible and navigation follows. Its duration is the time the page was visible before that send; time after a return to the tab is not measured.
 *
 * The tracker holds the view only. The event buffer of the service is separate state, so clearing events can never lose a view.
 */
import { allowedPageviewParams, isPageviewRoute } from '$lib/analytics/pageviewRoutes';

/** A view the tracker counts: a listed route, its locale and its allowed route parameters. */
export type View = { routeId: string; locale: string; params: Record<string, string> };

/** The pageview of a view, ready to be put into a batch. */
export type PageviewDraft = View & {
  /** The visible time spent on the view, in whole milliseconds. */
  duration: number;
};

/** The view as the router reports it, before it is checked against the pageview allowlist. */
type ViewStart = {
  routeId: string | null;
  locale: string;
  params: Readonly<Record<string, string | undefined>> | null;
};

/** The state of the current view. */
type ViewState = {
  view: View;
  /** When the page last became visible, or `undefined` while it is hidden. */
  visibleSince: number | undefined;
  /** The visible milliseconds accumulated before `visibleSince`. */
  visibleMs: number;
  /** Whether the pageview of this view has been taken. */
  sent: boolean;
};

/** A copy of a view, so a caller cannot change the stored one. */
function copyView(view: View): View {
  return { routeId: view.routeId, locale: view.locale, params: { ...view.params } };
}

/**
 * Create a tracker for the current view.
 *
 * @param deps.now - A monotonic clock in milliseconds, e.g. `() => performance.now()`.
 */
export function createViewTracker(deps: { now: () => number }): {
  start(view: ViewStart, visible: boolean): void;
  setVisible(visible: boolean): void;
  takePageview(): PageviewDraft | undefined;
  currentView(): View | undefined;
} {
  let state: ViewState | undefined;

  return {
    /** Begin a view. A route that is not listed, or no route at all, leaves no view, so nothing is sent for it. */
    start({ routeId, locale, params }, visible) {
      if (routeId === null || !isPageviewRoute(routeId)) {
        state = undefined;
        return;
      }
      state = {
        view: { routeId, locale, params: allowedPageviewParams(routeId, params ?? {}) },
        visibleSince: visible ? deps.now() : undefined,
        visibleMs: 0,
        sent: false
      };
    },

    /** Record a change of the page's visibility; a report of the state already held changes nothing. */
    setVisible(visible) {
      if (!state) return;
      if (visible && state.visibleSince === undefined) {
        state.visibleSince = deps.now();
      } else if (!visible && state.visibleSince !== undefined) {
        state.visibleMs += deps.now() - state.visibleSince;
        state.visibleSince = undefined;
      }
    },

    /** The pageview of the current view, the first time it is asked for; `undefined` afterwards and when there is no view. */
    takePageview() {
      if (!state || state.sent) return undefined;
      const running = state.visibleSince === undefined ? 0 : deps.now() - state.visibleSince;
      state.sent = true;
      return { ...copyView(state.view), duration: Math.max(0, Math.round(state.visibleMs + running)) };
    },

    /** The current view, whether or not its pageview has been taken. */
    currentView() {
      return state ? copyView(state.view) : undefined;
    }
  };
}
