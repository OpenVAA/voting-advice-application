import { UniversalFeedbackWriter } from '$lib/api/base/universalFeedbackWriter';
import { strapiAdapterMixin } from '../strapiAdapter';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';
import type { FeedbackData } from '$lib/api/base/feedbackWriter.type';

export class StrapiFeedbackWriter extends strapiAdapterMixin(UniversalFeedbackWriter) {
  protected _postFeedback(data: WithRequired<FeedbackData, 'date'>): Promise<DataApiActionResult> {
    return this.apiPost({
      endpoint: 'setFeedback',
      body: { data }
    }).then(() => ({ type: 'success' }));
  }
}
