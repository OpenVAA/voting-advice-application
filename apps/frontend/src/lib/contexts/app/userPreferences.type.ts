/**
 * Persistent preferences that can be set by the user.
 */
export type UserPreferences = {
  /**
   * The user's data collection consent and the date of giving or denying the consent, made in the voter app or the admin app. The Contestant App never reads or writes it.
   */
  dataCollection?: ConsentChoice;
  /**
   * The contestant's data collection consent and its date, made in the Contestant App: when accepting the terms of use or on its privacy page. Only the Contestant App reads it.
   */
  contestantDataConsent?: ConsentChoice;
  feedback: {
    status: FeedbackStatus;
    date: string;
  };
  survey: {
    status: FeedbackStatus;
    date: string;
  };
};

/**
 * A stored data collection consent and the date of giving or denying it.
 */
export type ConsentChoice = {
  consent: ConsentStatus;
  date: string;
};

/**
 * The member of `UserPreferences` that holds the consent choice of the app a route belongs to.
 */
export type ConsentPreferenceKey = 'dataCollection' | 'contestantDataConsent';

/**
 * The possible values for a user's data collection consent. The default status `indetermined` means the user has not yet made a decision.
 */
export type ConsentStatus = 'denied' | 'granted' | 'indetermined';

/**
 * The possible values for the status of asking for a user's feedback or filling out a survey.
 *
 * `dismissed` is persisted by `setFeedbackStatus('dismissed')` (when the user closes the feedback popup without responding) and read back / compared at the popup-countdown predicates — it must be representable here. Mirrors the global `UserFeedbackStatus`.
 */
export type FeedbackStatus = 'received' | 'dismissed' | 'indetermined';
