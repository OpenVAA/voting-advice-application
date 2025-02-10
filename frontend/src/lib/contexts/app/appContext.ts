import { type DynamicSettings, dynamicSettings, staticSettings } from '@openvaa/app-shared';
import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { get, type Writable, writable } from 'svelte/store';
import { browser } from '$app/environment';
import { feedbackWriter as feedbackWriterPromise } from '$lib/api/feedbackWriter';
import { FeedbackPopup } from '$lib/dynamic-components/feedback/popup';
import { SurveyPopup } from '$lib/dynamic-components/survey/popup';
import { mergeAppSettings } from '$lib/utils/settings';
import { getRoute } from './getRoute';
import { popupStore } from './popup';
import { surveyLink } from './survey';
import { trackingService } from './tracking';
import { getComponentContext } from '../component';
import { getDataContext } from '../data';
import { pageDatumStore } from '../utils/pageDatumStore';
import { localStorageWritable } from '../utils/storageStore';
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
  // App settings, customization and user preferences
  ////////////////////////////////////////////////////////////////////

  const appType: Writable<AppType> = writable();

  // Both appSettings and appCustomization are updated directly from $page.data

  /**
   * NB! Settings are overwritten by root key.
   * TODO: Handle merging so that empty objects do not overwrite defaults
   */
  const appSettings = writable<AppSettings>(mergeAppSettings(staticSettings, dynamicSettings));

  // Subscribe to data update promises and update the appSettings store
  const appSettingsData = pageDatumStore<DynamicSettings>('appSettingsData');

  appSettingsData.subscribe(async (promise) => {
    if (!promise) return;
    const data = await promise;
    // Errors are handled by +layout.svelte
    if (!data || data instanceof Error) return;
    appSettings.update((current) => mergeAppSettings(current, data));
  });

  const appCustomization = writable<AppCustomization>({});

  // Subscribe to data update promises and update the appCustomizationWritable store
  const appCustomizationData = pageDatumStore<AppCustomization>('appCustomizationData');

  appCustomizationData.subscribe(async (promise) => {
    if (!promise) return;
    const data = await promise;
    // Errors are handled by +layout.svelte
    if (!data || data instanceof Error) return;
    appCustomization.set(data);
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
  const openFeedbackModal: Writable<() => void | undefined> = writable();

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

  let feedbackTimeout: NodeJS.Timeout | undefined;

  function startFeedbackPopupCountdown(delay = 3 * 60): void {
    if (feedbackTimeout) return;
    feedbackTimeout = setTimeout(() => {
      if (get(userPreferences).feedback?.status !== 'received') popupQueue.push(FeedbackPopup);
    }, delay * 1000);
  }

  let surveyTimeout: NodeJS.Timeout | undefined;

  function startSurveyPopupCountdown(delay = 5 * 60): void {
    if (surveyTimeout) return;
    surveyTimeout = setTimeout(() => {
      if (get(userPreferences).survey?.status !== 'received') popupQueue.push(SurveyPopup);
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
    ...getComponentContext(),
    ...getDataContext(),
    ...tracking,
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
