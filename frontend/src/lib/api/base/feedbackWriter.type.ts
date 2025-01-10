/**
 * The `FeedbackWriter` interface defines the API call for writing feedback.
 */
export interface FeedbackWriter {
  /**
   * Post a new feedback item to the server.
   * @param data - The feedback data to send. Missing optional data are filled in.
   * @returns A `Promise` resolving to a `Response`.
   * @throws Error on failure.
   */
  postFeedback: (data: FeedbackData) => Promise<Response>;
}

/**
 * Feedback send to from the app's feedback components. The data must include at least a rating or a description. The rest of the data are attempted to be filled in if missing.
 */
export type FeedbackData = (
  | {
      /**
       * Between 1 and 5.
       */
      rating: number;
      /**
       * An optional message sent by the user.
       */
      description?: string;
    }
  | {
      /**
       * Between 1 and 5.
       */
      rating?: number;
      /**
       * An optional message sent by the user.
       */
      description: string;
    }
) & {
  /**
   * Feedback timestamp as a JSON date string.
   */
  date?: string;
  /**
   * Url of the page the feedback was sent from.
   */
  url?: string;
  /**
   * Client `userAgent` string.
   */
  userAgent?: string;
};
