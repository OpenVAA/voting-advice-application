/**
 * Persistent preferences that can be set by the user.
 */
export type UserPreferences = {
  /**
   * The user's data collection consent and the date of giving or denying the consent.
   */
  dataCollection?: {
    consent: ConsentStatus;
    date: string;
  };
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
 * The possible values for a user's data collection consent. The default status `indetermined` means the user has not yet made a decision.
 */
export type ConsentStatus = 'denied' | 'granted' | 'indetermined';

/**
 * The possible values for the status of asking for a user's feedback or filling out a survey.
 */
export type FeedbackStatus = 'received' | 'indetermined';
