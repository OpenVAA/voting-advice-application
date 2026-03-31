import type { Readable, Writable } from 'svelte/store';
import type { FeedbackWriter } from '$lib/api/base/feedbackWriter.type';
import type { ComponentContext } from '../component';
import type { DataContext } from '../data';
import type { AppCustomization } from './appCustomization.type';
import type { getRoute } from './getRoute.svelte';
import type { PopupStore } from './popup';
import type { TrackingService } from './tracking';
import type { UserPreferences } from './userPreferences.type';

/**
 * The AppContext type.
 *
 * ComponentContext properties (`locale`, `locales`, `darkMode`) are overridden with
 * store-wrapped versions for backward compat with downstream Phase-52 contexts
 * (VoterContext, CandidateContext, AdminContext) which use `derived([locale, ...])`.
 *
 * Plain function properties (`t`, `translate`) are kept as-is from ComponentContext.
 */
export type AppContext = Omit<ComponentContext, 'locale' | 'locales' | 'darkMode'> &
  DataContext &
  TrackingService & {
    /**
     * The current locale as a readable store (store-wrapped for downstream context compat).
     */
    locale: Readable<string>;
    /**
     * Available locales as a readable store (store-wrapped for downstream context compat).
     */
    locales: Readable<readonly string[]>;
    /**
     * Dark mode state as a readable store (store-wrapped for downstream context compat).
     */
    darkMode: Readable<boolean>;
    /**
     * The application type we're using. Set this to the current type in the layout containing the app.
     */
    appType: Writable<AppType>;
    /**
     * A store for app customization from `DataProvider`.
     * NB. The store is `Writable`, but it should not be written to under normal circumstances.
     */
    appCustomization: Writable<AppCustomization>;
    /**
     * A store for currently effective app settings.
     * NB. The store is `Writable`, but it should not be written to under normal circumstances.
     */
    appSettings: Writable<AppSettings>;
    /**
     * A store for building routes.
     */
    getRoute: typeof getRoute;
    /**
     * A store containing the possible survey link.
     */
    surveyLink: Readable<string | undefined>;
    /**
     * A store for user (not necessarily a voter) preferences which is maintained in local storage.
     */
    userPreferences: Writable<UserPreferences>;
    /**
     * A store that manages a queue of popup components and resolves to the first component in the queue.
     */
    popupQueue: PopupStore;
    /**
     * A store that holds the function for opening the feedback modal.
     * TODO: Refactor when Cand App is refactored.
     */
    openFeedbackModal: Writable<() => void | undefined>;
    /**
     * Send feedback using the `FeedbackWriter` api.
     */
    sendFeedback: FeedbackWriter['postFeedback'];
    /**
     * Start the countdown for the feedback popup, after which it will be shown on next page load. This will do nothing, if the user has already given their feedback.
     * @param delay - The delay in seconds. @default 180 (3 minutes)
     */
    startFeedbackPopupCountdown: (delay?: number) => void;
    /**
     * Start the countdown for the survey popup, after which it will be shown on next page load. This will do nothing, if the user has already opened the survey.
     * @param delay - The delay in seconds. @default 300 (5 minutes)
     */
    startSurveyPopupCountdown: (delay?: number) => void;
    /**
     * Set the user's data consent together with the date of giving or denying the consent.
     * @param consent - The value for the consent
     */
    setDataConsent: (consent: UserDataCollectionConsent) => void;
    /**
     * Set the user's feedback status together with the date of update.
     * @param status - The value for the status
     */
    setFeedbackStatus: (status: UserFeedbackStatus) => void;
    /**
     * Set the user's survey filling status together with the date of update.
     * @param status - The value for the status
     */
    setSurveyStatus: (status: UserFeedbackStatus) => void;
  };

/**
 * The possible types of the application
 */
export type AppType = 'admin' | 'candidate' | 'voter' | undefined;
