import { dynamicSettings, staticSettings } from '@openvaa/app-shared';
import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { browser } from '$app/environment';
import { page } from '$app/state';
import { feedbackWriter as feedbackWriterPromise } from '$lib/api/feedbackWriter';
import { FeedbackPopup } from '$lib/dynamic-components/feedback/popup';
import { SurveyPopup } from '$lib/dynamic-components/survey/popup';
import { mergeAppSettings, mergeInitialAppSettings } from '$lib/utils/settings';
import { createGetRoute } from './getRoute.svelte';
import { popupStore } from './popup';
import { surveyLink } from './survey.svelte';
import { trackingService } from './tracking';
import { getComponentContext } from '../component';
import { getDataContext } from '../data';
import { localStorageState } from '../utils/persistedState.svelte';
import type { DynamicSettings } from '@openvaa/app-shared';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';
import type { FeedbackData } from '$lib/api/base/feedbackWriter.type';
import type { AppContext, AppType } from './appContext.type';
import type { AppCustomization } from './appCustomization.type';
import type { UserPreferences } from './userPreferences.type';

const CONTEXT_KEY = Symbol();

export function getAppContext() {
  if (!hasContext(CONTEXT_KEY)) error(500, 'GetAppContext() called before initAppContext()');
  return getContext<AppContext>(CONTEXT_KEY);
}

/**
 * Initialize and return the context. This must be called before `getAppContext()` and cannot be called twice.
 * @returns The context object
 */
export function initAppContext(): AppContext {
  if (hasContext(CONTEXT_KEY)) error(500, 'InitAppContext() called for a second time');

  ////////////////////////////////////////////////////////////////////
  // Spread contexts from ComponentContext and DataContext
  ////////////////////////////////////////////////////////////////////

  const componentCtx = getComponentContext();
  const dataCtx = getDataContext();

  // `getRoute` is a rune-native `{ readonly current: RouteBuilder }` handle
  // (CTX-08). It must be created here (not at module load) because
  // `createGetRoute` uses `$derived.by`, which requires component-init context.
  // See `getRoute.svelte.ts` header for the per-field `page` read rationale.
  const getRoute = createGetRoute();

  // Re-expose the plain ComponentContext values as pure `{ current }` rune
  // handles. Downstream contexts read these via `.current` (no store bridge).
  const localesExport = {
    get current() {
      return componentCtx.locales;
    }
  };

  ////////////////////////////////////////////////////////////////////
  // App settings, customization and user preferences
  ////////////////////////////////////////////////////////////////////

  let appTypeValue = $state<AppType>(undefined);
  const appType = {
    get current() {
      return appTypeValue;
    },
    set(v: AppType) {
      appTypeValue = v;
    },
    update(fn: (v: AppType) => AppType) {
      appTypeValue = fn(appTypeValue);
    }
  };

  /**
   * NB! Settings are overwritten by root key.
   * TODO: Handle merging so that empty objects do not overwrite defaults
   *
   * D-04 (CTX-01): the DB override is folded into the INITIAL `$state` value,
   * read synchronously from `page.data.appSettingsData`. This runs both
   * server-side AND client-side, so the server-rendered HTML already carries
   * the DB override — no post-hydration default→override flash (the real
   * production bug spike 008 surfaced; `$effect` does not run on the server).
   * The `$effect` below now handles only post-navigation `page.data` changes.
   */
  const initialAppSettingsData = page.data?.appSettingsData as DynamicSettings | Error | undefined;
  let appSettingsValue = $state<AppSettings>(
    mergeInitialAppSettings(staticSettings, dynamicSettings, initialAppSettingsData)
  );
  const appSettings = {
    get current() {
      return appSettingsValue;
    },
    set(v: AppSettings) {
      appSettingsValue = v;
    },
    update(fn: (v: AppSettings) => AppSettings) {
      appSettingsValue = fn(appSettingsValue);
    }
  };

  // Read appSettingsData directly from page.data (replaces pageDatumStore per D-02)
  //
  // Track the previous `data` reference to skip merges when SvelteKit hands us
  // the same loader result on a URL change (e.g., drawer open/close — root
  // layout loader has no URL deps so its data is cached). Without this guard
  // `mergeAppSettings` always produces a new AppSettings object, which Svelte
  // 5 propagates as a state change, cascading through `entityTypes` →
  // `nominationAndQuestionStore` → `filterStore` and recreating every
  // `FilterGroup` on every navigation. Surfaced during Phase 64 manual smoke
  // as "filter badge disappears on drawer open / portraits reload on close".
  // Svelte 4 stores absorbed this via `safe_not_equal`; raw `$state =` doesn't.
  //
  // Initialized to the init-time DB value (D-04) so the first post-init run
  // does not re-merge the identical payload already folded into `$state` above.
  let prevAppSettingsData: DynamicSettings | Error | undefined = initialAppSettingsData;
  $effect(() => {
    const data = page.data?.appSettingsData as DynamicSettings | Error | undefined;
    if (data === prevAppSettingsData) return;
    prevAppSettingsData = data;
    if (!data || data instanceof Error) return;
    appSettingsValue = mergeAppSettings(appSettingsValue, data);
  });

  // Same D-04 synchronous-init treatment for appCustomization: fold the DB
  // override into the initial `$state` value (SSR-correct, no flash).
  const initialAppCustomizationData = page.data?.appCustomizationData as AppCustomization | Error | undefined;
  let appCustomizationValue = $state<AppCustomization>(
    initialAppCustomizationData && !(initialAppCustomizationData instanceof Error)
      ? initialAppCustomizationData
      : {}
  );
  const appCustomization = {
    get current() {
      return appCustomizationValue;
    },
    set(v: AppCustomization) {
      appCustomizationValue = v;
    },
    update(fn: (v: AppCustomization) => AppCustomization) {
      appCustomizationValue = fn(appCustomizationValue);
    }
  };

  // Same reference-equality guard as appSettingsData above; initialized to the
  // init-time DB value so the first post-init run skips the identical payload.
  let prevAppCustomizationData: AppCustomization | Error | undefined = initialAppCustomizationData;
  $effect(() => {
    const data = page.data?.appCustomizationData as AppCustomization | Error | undefined;
    if (data === prevAppCustomizationData) return;
    prevAppCustomizationData = data;
    if (!data || data instanceof Error) return;
    appCustomizationValue = data;
  });

  // See also utility methods below. `localStorageState` is a rune-native
  // `{ current, set, update }` persisted handle (no store-bridge wrapper needed).
  const userPreferences = localStorageState('appContext-userPreferences', {} as UserPreferences);

  ////////////////////////////////////////////////////////////////////
  // Rune-input handles for the pure-rune survey/tracking producers
  ////////////////////////////////////////////////////////////////////

  // The survey/tracking producers are pure-rune (CTX-06): they read their
  // inputs via `.current` getters. `appSettings` and `userPreferences` are
  // already `{ current }` rune handles, so pass them directly — no second
  // source of truth, no store bridge.

  ////////////////////////////////////////////////////////////////////
  // Tracking, survey and popups
  ////////////////////////////////////////////////////////////////////

  // Producers return rune handles; consumers read `.current` directly.
  const tracking = trackingService({
    appSettings,
    userPreferences
  });

  const survey = surveyLink({ appSettings, sessionId: tracking.sessionId });

  const popupQueue = popupStore();

  // TODO: Refactor when Cand App is refactored
  let openFeedbackModalValue = $state<(() => void) | undefined>(undefined);
  const openFeedbackModal = {
    get current() {
      return openFeedbackModalValue;
    },
    set(v: (() => void) | undefined) {
      openFeedbackModalValue = v;
    }
  };

  ////////////////////////////////////////////////////////////////////
  // Sending feedback
  ////////////////////////////////////////////////////////////////////

  async function sendFeedback(feedback: FeedbackData): Promise<DataApiActionResult> {
    if (!browser) error(500, 'sendFeedback() called in a non-browser environment');
    const feedbackWriter = await feedbackWriterPromise;
    feedbackWriter.init({ fetch });
    return feedbackWriter.postFeedback(feedback);
  }

  ////////////////////////////////////////////////////////////////////
  // Utility methods for popups and setting user preferences
  ////////////////////////////////////////////////////////////////////

  // `userPreferences` is a `localStorageState` rune handle; its `.current`
  // getter is the reactive read used by the popup-countdown predicates below.
  const userPrefsReactive = userPreferences;

  let feedbackTimeout: NodeJS.Timeout | undefined;

  function startFeedbackPopupCountdown(delay = 3 * 60): void {
    if (feedbackTimeout) clearTimeout(feedbackTimeout);
    if (delay <= 0) return;
    feedbackTimeout = setTimeout(() => {
      const feedbackStatus = userPrefsReactive.current.feedback?.status;
      if (feedbackStatus !== 'received' && feedbackStatus !== 'dismissed')
        popupQueue.push({
          component: FeedbackPopup,
          onClose: () => {
            // Persist dismissal so the popup doesn't reappear after reload
            if (userPrefsReactive.current.feedback?.status !== 'received')
              setFeedbackStatus('dismissed');
          }
        });
    }, delay * 1000);
  }

  let surveyTimeout: NodeJS.Timeout | undefined;

  function startSurveyPopupCountdown(delay = 5 * 60): void {
    if (surveyTimeout) clearTimeout(surveyTimeout);
    if (delay <= 0) return;
    surveyTimeout = setTimeout(() => {
      if (userPrefsReactive.current.survey?.status !== 'received') popupQueue.push({ component: SurveyPopup });
    }, delay * 1000);
  }

  function setDataConsent(consent: UserDataCollectionConsent): void {
    userPreferences.update((d) => ({
      ...d,
      dataCollection: { consent, date: new Date().toISOString() }
    }));
    if (consent === 'granted') {
      tracking.startEvent('dataConsent_granted');
    }
  }

  function setFeedbackStatus(status: UserFeedbackStatus): void {
    userPreferences.update((d) => ({
      ...d,
      feedback: { status, date: new Date().toISOString() }
    }));
  }

  function setSurveyStatus(status: UserFeedbackStatus): void {
    userPreferences.update((d) => ({
      ...d,
      survey: { status, date: new Date().toISOString() }
    }));
  }

  // `.current`-getter accessors over the SAME `$state` the `appSettings` /
  // `locale` rune handles read (single source of truth — mirroring the shipped
  // `reactiveDataRoot` precedent). Consumed by downstream voter/candidate
  // contexts via `.current`.
  const reactiveAppSettings = {
    get current() {
      return appSettingsValue;
    }
  };
  const reactiveLocale = {
    get current() {
      return componentCtx.locale;
    }
  };

  // Pure `{ current }` rune handles for the exported `locale` / `darkMode`
  // values. The `current` getter reads the SAME ComponentContext value (single
  // source of truth). Consumers read `.current` directly — no store bridge.
  const localeExport = {
    get current() {
      return componentCtx.locale;
    }
  };
  const darkModeExport = {
    get current() {
      return componentCtx.darkMode;
    }
  };

  return setContext<AppContext>(CONTEXT_KEY, {
    ...componentCtx,
    ...dataCtx,
    ...tracking,
    // The producers expose rune handles directly; the `...tracking` spread
    // already carries `sendTrackingEvent`/`sessionId`/`shouldTrack` as pure
    // `{ current, set? }` rune handles matching `TrackingService`.
    // Override plain ComponentContext values with the `{ current }` rune
    // handles for downstream Phase-52 contexts (read via `.current`).
    locale: localeExport,
    locales: localesExport,
    darkMode: darkModeExport,
    reactiveAppSettings,
    reactiveLocale,
    appCustomization,
    appSettings,
    appType,
    getRoute,
    openFeedbackModal,
    popupQueue,
    sendFeedback,
    setDataConsent,
    setFeedbackStatus,
    setSurveyStatus,
    startFeedbackPopupCountdown,
    startSurveyPopupCountdown,
    surveyLink: survey,
    userPreferences,

    ////////////////////////////////////////////////////////////////////
    // Phase 102 handle-idiom PoC (Plan 02) — ADDITIVE, atomic-landing.
    //
    // These three properties prove the locked Phase-103 target idioms
    // (102-DECISION-RECORD.md) compile green inside the REAL appContext
    // factory, without touching the existing `.current` handle members
    // (`darkMode`/`appType`/`getRoute`) — so every current consumer keeps
    // working and the build stays green at this commit boundary (Phase-97
    // additive-getter technique).
    //
    // They are deliberately ADDITIVE under `_poc*` names rather than a fold
    // of the canonical properties because the spike empirically confirmed
    // that ALL THREE canonical handles are DESTRUCTURED by consumers
    // (`const { darkMode, appType, getRoute } = getAppContext()`, 6 / 8 / many
    // sites). Folding the canonical property to a context-property getter
    // would invoke the getter once at destructure time and capture a stale
    // snapshot — the CLAUDE.md "Context Destructuring Rule" trap. Migrating
    // those destructuring consumers to `ctx.x` / `$derived(ctx.x)` reads IS
    // the Phase-103 codemod, which is out of this spike's scope. Phase 103
    // codemods consumers onto the canonical names and removes both these
    // `_poc*` surfaces and the old `.current` handles.
    //
    // - read-only fold:  `_pocDarkMode` — plain getter (was `darkMode.current`)
    // - read-write pair: `_pocAppType` — get/set accessor over the SAME
    //                    `appTypeValue` $state the `appType` handle uses
    //                    (round-trips `ctx._pocAppType = v` → `ctx._pocAppType === v`)
    // - getRoute fold:   `_pocGetRoute` — plain getter returning the callable
    //                    RouteBuilder (was `getRoute.current(opts)`); the
    //                    producer `createGetRoute()` `$derived.by` is untouched.
    ////////////////////////////////////////////////////////////////////
    get _pocDarkMode() {
      return componentCtx.darkMode;
    },
    get _pocAppType() {
      return appTypeValue;
    },
    set _pocAppType(v: AppType) {
      appTypeValue = v;
    },
    get _pocGetRoute() {
      return getRoute.current;
    }
  });
}
