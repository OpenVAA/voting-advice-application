import { UniversalFeedbackWriter } from '$lib/api/base/universalFeedbackWriter';
import { apiRouteAdapterMixin } from '../apiRouteAdapter';
import type { FeedbackData } from '$lib/api/base/feedbackWriter.type';

export class ApiRouteDataFeedbackWriter extends apiRouteAdapterMixin(UniversalFeedbackWriter) {
  protected _postFeedback(data: WithRequired<FeedbackData, 'date'>): Promise<Response> {
    return this.apiPost({
      endpoint: 'feedbacks',
      request: {
        body: JSON.stringify({ data })
      }
    });
  }
}
