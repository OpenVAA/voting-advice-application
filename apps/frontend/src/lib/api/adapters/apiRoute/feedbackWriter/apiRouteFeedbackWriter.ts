import { UniversalFeedbackWriter } from '$lib/api/base/universalFeedbackWriter';
import { apiRouteAdapterMixin } from '../apiRouteAdapter';
import type { FeedbackData } from '$lib/api/base/feedbackWriter.type';
import type { ApiRouteReturnType } from '../apiRoutes';

export class ApiRouteDataFeedbackWriter extends apiRouteAdapterMixin(UniversalFeedbackWriter) {
  protected _postFeedback(data: WithRequired<FeedbackData, 'date'>): Promise<ApiRouteReturnType<'setFeedback'>> {
    return this.apiPost({
      endpoint: 'setFeedback',
      body: { data }
    });
  }
}
