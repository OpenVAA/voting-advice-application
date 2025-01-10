import { UniversalFeedbackWriter } from '$lib/api/base/universalFeedbackWriter';
import { strapiAdapterMixin } from '../strapiAdapter';
import type { FeedbackData } from '$lib/api/base/feedbackWriter.type';

export class StrapiFeedbackWriter extends strapiAdapterMixin(UniversalFeedbackWriter) {
  protected _postFeedback(data: WithRequired<FeedbackData, 'date'>): Promise<Response> {
    return this.apiPost({
      endpoint: 'feedbacks',
      request: {
        body: JSON.stringify({ data })
      }
    });
  }
}
