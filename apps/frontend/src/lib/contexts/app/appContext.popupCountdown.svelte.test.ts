import { flushSync } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ─────────────────────────────────────────────────────────────────────────────
// Popup-countdown behaviour guard for `AppContextProvider`.
//
// The two countdowns (`startFeedbackPopupCountdown` / `startSurveyPopupCountdown`) enqueue a popup from a `setTimeout` callback, and the arming call sites in the results layout re-arm on EVERY app-settings change (deliberately — settings arrive after mount). Nothing at the arming site stops a re-arm from re-queueing a popup the user already closed; the only thing that can is the timeout's own persisted-status guard plus a queue item that PERSISTS the dismissal when it closes. This file locks both halves for both countdowns.
//
// Two stub deviations from `appContext.spread.svelte.test.ts` are load-bearing here:
//   • the user-preferences stub is LIVE — `update` applies the updater to a mutable holder that the `current` getter reads back — otherwise the status the countdown guard reads can never reflect what the close handler wrote and every assertion passes vacuously.
//   • the popup-queue stub RECORDS pushed items, so a case can count pushes and reach into a recorded item to invoke its close handler.
// ─────────────────────────────────────────────────────────────────────────────

/** The subset of `UserPreferences` these cases read and write. */
type PrefsShape = {
  feedback?: { status: string; date: string };
  survey?: { status: string; date: string };
  dataCollection?: { consent: string; date: string };
};

/** What the recording popup-queue stub captures per push. */
type RecordedItem = { component: unknown; props?: Record<string, unknown>; onClose?: () => void };

// `vi.mock` factories are hoisted; the mutable holders they reference are created via `vi.hoisted` (also hoisted, evaluated first).
const { stubs, prefsHolder, pushed } = vi.hoisted(() => {
  type Prefs = {
    feedback?: { status: string; date: string };
    survey?: { status: string; date: string };
    dataCollection?: { consent: string; date: string };
  };
  type Item = { component: unknown; props?: Record<string, unknown>; onClose?: () => void };

  const prefsHolder: { value: Prefs } = { value: {} };
  const pushed: Array<Item> = [];

  return {
    prefsHolder,
    pushed,
    stubs: {
      // componentCtx: stable members + direct reactive reads.
      component: {
        t: (key: string) => key,
        translate: (key: string) => key,
        locale: 'en',
        locales: ['en', 'fi'],
        darkMode: false
      },
      // dataCtx: own-enumerable accessor + arrow-field writer (matches production's descriptor shape).
      data: {
        get dataRoot(): unknown {
          return undefined;
        },
        setDataRoot: (_v: unknown) => {}
      },
      // tracking producer: only the six members appContext's selective forward takes.
      tracking: {
        sendTrackingEvent: { current: () => {}, set: (_v: unknown) => {} },
        startPageview: (_href: string) => {},
        startEvent: (_name: string) => {},
        track: (_name: string, _data?: unknown) => {},
        submitAllEvents: () => {},
        resetAllEvents: () => {}
      },
      // survey-link producer: `{ readonly current }` handle.
      survey: { current: 'https://example.invalid/survey' as string | undefined },
      // popup queue producer — RECORDING stub. Same surface as the real `PopupState`.
      popup: {
        current: undefined,
        push: (item: Item) => {
          pushed.push(item);
        },
        shift: () => {}
      },
      // getRoute producer: `{ readonly current: RouteBuilder }` handle.
      getRoute: { current: (() => '/') as unknown },
      // localStorageState persisted handle — LIVE, not inert: `update` writes through the holder the `current` getter reads back.
      userPreferences: {
        get current(): Prefs {
          return prefsHolder.value;
        },
        set(v: Prefs) {
          prefsHolder.value = v;
        },
        update(fn: (d: Prefs) => Prefs) {
          prefsHolder.value = fn(prefsHolder.value);
        }
      }
    }
  };
});

// `page.data` is read synchronously by the SSR field initializers; a minimal page with empty `data` makes the merge fall back to static defaults.
vi.mock('$app/state', () => ({
  page: {
    get data() {
      return {};
    },
    params: {},
    route: { id: null },
    url: new URL('http://localhost/')
  }
}));

vi.mock('$app/environment', () => ({ browser: false }));

// Upstream contexts (absent headlessly) — return own-enumerable stubs.
vi.mock('../component', () => ({ getComponentContext: () => stubs.component }));
vi.mock('../data', () => ({ getDataContext: () => stubs.data }));

// App producers — minimal own-enumerable handle stubs so construction runs.
vi.mock('./tracking', () => ({ trackingService: () => stubs.tracking }));
vi.mock('./survey.svelte', () => ({ surveyLink: () => stubs.survey }));
vi.mock('./popup', () => ({ popupState: () => stubs.popup }));
vi.mock('./getRoute.svelte', () => ({ createGetRoute: () => stubs.getRoute }));
vi.mock('../utils/persistedState.svelte', () => ({
  localStorageState: () => stubs.userPreferences
}));

// `AppContextProvider` is exported as a documented test seam; production code uses the `initAppContext()` / `getAppContext()` factory wrappers.
const { AppContextProvider } = await import('./appContext.svelte');

/** Seconds; the countdowns multiply by 1000 before handing the value to `setTimeout`. */
const DELAY = 5;

describe('AppContextProvider — popup countdowns', () => {
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    vi.useFakeTimers();
    prefsHolder.value = {};
    pushed.length = 0;
  });

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  /** Construct the provider inside `$effect.root` so its constructor `$effect`s settle, then `flushSync`. */
  function setup(): InstanceType<typeof AppContextProvider> {
    let instance!: InstanceType<typeof AppContextProvider>;
    cleanup = $effect.root(() => {
      instance = new AppContextProvider();
    });
    flushSync();
    return instance;
  }

  /** Advance past the configured countdown so the timer callback runs. */
  function fireCountdown(): void {
    vi.advanceTimersByTime(DELAY * 1000 + 1);
  }

  function prefs(): PrefsShape {
    return prefsHolder.value;
  }

  function items(): Array<RecordedItem> {
    return pushed;
  }

  describe('startSurveyPopupCountdown', () => {
    it('enqueues exactly one survey popup when the armed countdown fires', () => {
      const ctx = setup();
      ctx.startSurveyPopupCountdown(DELAY);
      expect(items()).toHaveLength(0);
      fireCountdown();
      expect(items()).toHaveLength(1);
    });

    it('persists a dismissed survey status when the queued item is closed', () => {
      const ctx = setup();
      ctx.startSurveyPopupCountdown(DELAY);
      fireCountdown();

      const item = items()[0];
      // The close handler is the ONLY affordance that can persist the dismissal (`PopupQueueItem.onClose`, invoked by the root layout before `popupQueue.shift()`).
      expect(typeof item.onClose, 'the survey queue item must carry an onClose that persists dismissal').toBe(
        'function'
      );
      item.onClose?.();

      expect(prefs().survey?.status).toBe('dismissed');
    });

    it('does not enqueue again after the survey popup was dismissed', () => {
      const ctx = setup();
      ctx.startSurveyPopupCountdown(DELAY);
      fireCountdown();
      items()[0].onClose?.();
      expect(prefs().survey?.status).toBe('dismissed');

      // The results layout re-arms on every settings change; a dismissed status must make the re-armed countdown a no-op.
      ctx.startSurveyPopupCountdown(DELAY);
      fireCountdown();

      expect(items()).toHaveLength(1);
    });

    it('does not downgrade a received survey status when the popup closes itself', () => {
      const ctx = setup();
      ctx.startSurveyPopupCountdown(DELAY);
      fireCountdown();

      // `SurveyButton` sets the status to received, and `SurveyPopup` then closes itself on a delay — so the close handler always runs AFTER a successful click-through.
      ctx.setSurveyStatus('received');
      items()[0].onClose?.();

      expect(prefs().survey?.status).toBe('received');
    });

    it('arming twice before the timer fires still enqueues only one item', () => {
      const ctx = setup();
      ctx.startSurveyPopupCountdown(DELAY);
      ctx.startSurveyPopupCountdown(DELAY);
      fireCountdown();

      expect(items()).toHaveLength(1);
    });

    it('arms nothing for a zero or negative delay', () => {
      const ctx = setup();
      ctx.startSurveyPopupCountdown(0);
      fireCountdown();
      expect(items()).toHaveLength(0);

      ctx.startSurveyPopupCountdown(-1);
      fireCountdown();
      expect(items()).toHaveLength(0);
    });

    it('does not enqueue when the survey status is already received', () => {
      const ctx = setup();
      ctx.setSurveyStatus('received');
      ctx.startSurveyPopupCountdown(DELAY);
      fireCountdown();

      expect(items()).toHaveLength(0);
    });
  });

  // Regression cover for the path this change does NOT touch — the feedback countdown already has the complete shape and must keep it.
  describe('startFeedbackPopupCountdown (untouched path)', () => {
    it('enqueues exactly one feedback popup per armed countdown', () => {
      const ctx = setup();
      ctx.startFeedbackPopupCountdown(DELAY);
      fireCountdown();

      expect(items()).toHaveLength(1);
    });

    it('persists a dismissed feedback status when the queued item is closed', () => {
      const ctx = setup();
      ctx.startFeedbackPopupCountdown(DELAY);
      fireCountdown();
      items()[0].onClose?.();

      expect(prefs().feedback?.status).toBe('dismissed');
    });

    it('does not enqueue again after the feedback popup was dismissed', () => {
      const ctx = setup();
      ctx.startFeedbackPopupCountdown(DELAY);
      fireCountdown();
      items()[0].onClose?.();

      ctx.startFeedbackPopupCountdown(DELAY);
      fireCountdown();

      expect(items()).toHaveLength(1);
    });

    it('does not downgrade a received feedback status when the popup closes', () => {
      const ctx = setup();
      ctx.startFeedbackPopupCountdown(DELAY);
      fireCountdown();

      ctx.setFeedbackStatus('received');
      items()[0].onClose?.();

      expect(prefs().feedback?.status).toBe('received');
    });
  });
});
