import { dynamicSettings, staticSettings } from '@openvaa/app-shared';
import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { fromStore, toStore } from 'svelte/store';
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
import { localStorageWritable } from '../utils/persistedState.svelte';
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

  // `getRoute` is a Readable<RouteBuilder>. It must be created here (not at
  // module load) because `createGetRoute` registers an `afterNavigate`
  // callback that requires component-init context. See `getRoute.svelte.ts`
  // header for the toStore + $app/state.page short-circuit rationale.
  const getRoute = createGetRoute();

  // Wrap plain ComponentContext values as stores for downstream context backward compat
  // (VoterContext uses derived([locale, ...]), filterStore expects Readable<string>, etc.)
  const localeStore = toStore(() => componentCtx.locale);
  const localesStore = toStore(() => componentCtx.locales);
  const darkModeStore = toStore(() => componentCtx.darkMode);

  ////////////////////////////////////////////////////////////////////
  // App settings, customization and user preferences
  ////////////////////////////////////////////////////////////////////

  let appTypeValue = $state<AppType>(undefined);
  const appType = toStore(
    () => appTypeValue,
    (v) => {
      appTypeValue = v;
    }
  );

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
  const appSettings = toStore(
    () => appSettingsValue,
    (v) => {
      appSettingsValue = v;
    }
  );

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
  const appCustomization = toStore(
    () => appCustomizationValue,
    (v) => {
      appCustomizationValue = v;
    }
  );

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

  // See also utility methods below
  const userPreferences = localStorageWritable('appContext-userPreferences', {} as UserPreferences);

  ////////////////////////////////////////////////////////////////////
  // Rune-input handles for the pure-rune survey/tracking producers
  ////////////////////////////////////////////////////////////////////

  // The survey/tracking producers are now pure-rune (CTX-06): they read their
  // inputs via `.current` getters, not `fromStore`. The seam owns the store↔rune
  // conversion, so wrap the relevant inputs as `{ current }` handles here. These
  // read the SAME `$state` / store the `toStore` exports wrap — no second source
  // of truth.
  const appSettingsHandle = {
    get current() {
      return appSettingsValue;
    }
  };
  const userPreferencesReactive = fromStore(userPreferences);
  const userPreferencesHandle = {
    get current() {
      return userPreferencesReactive.current;
    }
  };

  ////////////////////////////////////////////////////////////////////
  // Tracking, survey and popups
  ////////////////////////////////////////////////////////////////////

  // Producers return rune handles; the seam owns the store-shaped bridges so
  // un-migrated consumers (`$surveyLink`, `sendTrackingEventStore.set`,
  // `$shouldTrack`) keep working until Phase 98 removes them.
  const tracking = trackingService({
    appSettings: appSettingsHandle,
    userPreferences: userPreferencesHandle
  });

  // Store-shaped tracking bridges matching `trackingService.type.ts`.
  const trackingSessionIdStore = toStore(() => tracking.sessionId.current);
  const trackingShouldTrackStore = toStore(() => tracking.shouldTrack.current);
  const trackingSendEventStore = toStore(
    () => tracking.sendTrackingEvent.current,
    (v) => {
      tracking.sendTrackingEvent.set(v);
    }
  );

  const survey = surveyLink({ appSettings: appSettingsHandle, sessionId: tracking.sessionId });
  // Store-shaped survey bridge for `$surveyLink` consumers (SurveyButton/VoterNav).
  const surveyLinkStore = toStore(() => survey.current);

  const popupQueue = popupStore();

  // TODO: Refactor when Cand App is refactored
  let openFeedbackModalValue = $state<(() => void) | undefined>(undefined);
  const openFeedbackModal = toStore(
    () => openFeedbackModalValue,
    (v) => {
      openFeedbackModalValue = v;
    }
  );

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

  // Reuses the `userPreferencesReactive` handle created above for the tracking
  // producer (single `fromStore` over `userPreferences` at the seam).
  const userPrefsReactive = userPreferencesReactive;

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
  // `locale` `toStore` exports wrap (single source of truth — additive,
  // mirroring the shipped `reactiveDataRoot` precedent). Plan B (96-02) reads
  // these to drop `fromStore(appSettings)` / `fromStore(locale)`.
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

  return setContext<AppContext>(CONTEXT_KEY, {
    ...componentCtx,
    ...dataCtx,
    ...tracking,
    // The producers expose rune handles; re-shape the tracking surface back to
    // the store types declared on `TrackingService` (the `...tracking` spread
    // above carries the rune handles, so these overrides are required).
    sendTrackingEvent: trackingSendEventStore,
    sessionId: trackingSessionIdStore,
    shouldTrack: trackingShouldTrackStore,
    // Override plain ComponentContext values with store-wrapped versions
    // for backward compat with downstream Phase-52 contexts
    locale: localeStore,
    locales: localesStore,
    darkMode: darkModeStore,
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
    surveyLink: surveyLinkStore,
    userPreferences
  });
}
