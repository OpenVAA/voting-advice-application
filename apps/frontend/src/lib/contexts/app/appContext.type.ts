import type { FeedbackWriter } from '$lib/api/base/feedbackWriter.type';
import type { ComponentContext } from '../component';
import type { DataContext } from '../data';
import type { AppCustomization } from './appCustomization.type';
import type { RouteBuilder } from './getRoute.svelte';
import type { PopupState } from './popup';
import type { TrackingService } from './tracking';
import type { UserPreferences } from './userPreferences.type';

/**
 * The AppContext type.
 *
 * ComponentContext properties are overridden: `locale` is a BARE reactive accessor
 * (Phase 113 FLATTEN-02, read `ctx.locale`); `locales`/`darkMode` remain
 * `{ readonly current }` rune handles for downstream Phase-52 contexts (VoterContext,
 * CandidateContext, AdminContext) which read them via `.current`.
 *
 * Plain function properties (`t`, `translate`) are kept as-is from ComponentContext.
 */
export type AppContext = Omit<ComponentContext, 'locale' | 'locales' | 'darkMode'> &
  DataContext &
  TrackingService & {
    /**
     * The current locale, exposed as a BARE reactive accessor (Phase 113 FLATTEN-02).
     * Read directly via `ctx.locale`. MUST be read off `ctx` (never destructured) —
     * it is a reactive accessor per CLAUDE.md's Context Destructuring Rule.
     */
    readonly locale: string;
    /**
     * Available locales, exposed as a `{ readonly current }` rune handle. Read via `.current`.
     */
    locales: { readonly current: ReadonlyArray<string> };
    /**
     * Dark mode state, exposed as a `{ readonly current }` rune handle. Read via `.current`.
     */
    darkMode: { readonly current: boolean };
    /**
     * The application type we're using. Set this to the current type in the layout containing the app.
     */
    appType: {
      readonly current: AppType;
      set(v: AppType): void;
      update(fn: (v: AppType) => AppType): void;
    };
    /**
     * App customization from `DataProvider`, exposed as a writable rune handle.
     * NB. It is writable, but it should not be written to under normal circumstances.
     */
    appCustomization: {
      readonly current: AppCustomization;
      set(v: AppCustomization): void;
      update(fn: (v: AppCustomization) => AppCustomization): void;
    };
    /**
     * Currently effective app settings, exposed as a BARE reactive accessor (Phase 113
     * FLATTEN-02). Read directly via `ctx.appSettings`. MUST be read off `ctx` (never
     * destructured) — it is a reactive accessor per CLAUDE.md's Context Destructuring
     * Rule. The former writable `set`/`update` surface had no external callers; internal
     * writes go through the private `#appSettingsValue` $state (re-merge `$effect`s).
     */
    readonly appSettings: AppSettings;
    /**
     * Rune-native route-builder handle (CTX-08). Read via `getRoute.current(opts)`.
     */
    getRoute: { readonly current: RouteBuilder };
    /**
     * The possible survey link, exposed as a `{ readonly current }` rune handle. Read via `.current`.
     */
    surveyLink: { readonly current: string | undefined };
    /**
     * User (not necessarily a voter) preferences maintained in local storage,
     * exposed as a writable rune handle backed by `localStorageState`.
     */
    userPreferences: {
      readonly current: UserPreferences;
      set(v: UserPreferences): void;
      update(fn: (v: UserPreferences) => UserPreferences): void;
    };
    /**
     * A store that manages a queue of popup components and resolves to the first component in the queue.
     */
    popupQueue: PopupState;
    /**
     * Holds the function for opening the feedback modal, exposed as a writable rune handle.
     * TODO: Refactor when Cand App is refactored.
     */
    openFeedbackModal: {
      readonly current: (() => void) | undefined;
      set(v: (() => void) | undefined): void;
    };
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
