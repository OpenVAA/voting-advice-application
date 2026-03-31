import { dynamicSettings, staticSettings } from '@openvaa/app-shared';
import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { fromStore, toStore } from 'svelte/store';
import { browser } from '$app/environment';
import { page } from '$app/state';
import { feedbackWriter as feedbackWriterPromise } from '$lib/api/feedbackWriter';
import { FeedbackPopup } from '$lib/dynamic-components/feedback/popup';
import { SurveyPopup } from '$lib/dynamic-components/survey/popup';
import { mergeAppSettings } from '$lib/utils/settings';
import { getRoute } from './getRoute.svelte';
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
   */
  let appSettingsValue = $state<AppSettings>(mergeAppSettings(staticSettings, dynamicSettings));
  const appSettings = toStore(
    () => appSettingsValue,
    (v) => {
      appSettingsValue = v;
    }
  );

  // Read appSettingsData directly from page.data (replaces pageDatumStore per D-02)
  $effect(() => {
    const data = page.data?.appSettingsData as DynamicSettings | Error | undefined;
    if (!data || data instanceof Error) return;
    appSettingsValue = mergeAppSettings(appSettingsValue, data);
  });

  let appCustomizationValue = $state<AppCustomization>({});
  const appCustomization = toStore(
    () => appCustomizationValue,
    (v) => {
      appCustomizationValue = v;
    }
  );

  // Read appCustomizationData directly from page.data (replaces pageDatumStore per D-02)
  $effect(() => {
    const data = page.data?.appCustomizationData as AppCustomization | Error | undefined;
    if (!data || data instanceof Error) return;
    appCustomizationValue = data;
  });

  // See also utility methods below
  const userPreferences = localStorageWritable('appContext-userPreferences', {} as UserPreferences);

  ////////////////////////////////////////////////////////////////////
  // Tracking, survey and popups
  ////////////////////////////////////////////////////////////////////

  const tracking = trackingService({ appSettings, userPreferences });

  const survey = surveyLink({ appSettings, sessionId: tracking.sessionId });

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

  const userPrefsReactive = fromStore(userPreferences);

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

  return setContext<AppContext>(CONTEXT_KEY, {
    ...componentCtx,
    ...dataCtx,
    ...tracking,
    // Override plain ComponentContext values with store-wrapped versions
    // for backward compat with downstream Phase-52 contexts
    locale: localeStore,
    locales: localesStore,
    darkMode: darkModeStore,
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
    userPreferences
  });
}
