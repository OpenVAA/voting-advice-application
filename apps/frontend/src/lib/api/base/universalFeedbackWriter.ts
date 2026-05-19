import { browser } from '$app/environment';
import { UniversalAdapter } from './universalAdapter';
import type { DataApiActionResult } from './actionResult.type';
import type { FeedbackData, FeedbackWriter } from './feedbackWriter.type';

/**
 * The abstract base class that all universal `FeedbackWriter`s should extend. It implements error handling and pre-processing of raw data before it is posted.
 *
 * The subclasses must implement the protected `_postFeedback` method. The implementation may freely throw errors.
 */
export abstract class UniversalFeedbackWriter extends UniversalAdapter implements FeedbackWriter {
  postFeedback(data: FeedbackData): Promise<DataApiActionResult> {
    data.date ??= new Date().toJSON();
    if (browser) {
      data.url ??= window?.location?.href;
      data.userAgent ??= navigator?.userAgent;
    }
    return this._postFeedback(data as WithRequired<FeedbackData, 'date'>);
  }

  /**
   * Handle the actual posting. Must be implemented by subclasses.
   */
  protected abstract _postFeedback(data: WithRequired<FeedbackData, 'date'>): Promise<DataApiActionResult>;
}
