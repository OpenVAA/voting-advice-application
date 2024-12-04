import { LocalServerAdapter } from '../localServerAdapter';
import type { FeedbackData, FeedbackWriter } from '$lib/api/base/feedbackWriter.type';

export class LocalServerFeedbackWriter extends LocalServerAdapter implements FeedbackWriter {
  postFeedback(data: FeedbackData): Promise<Response> {
    data.date ??= new Date().toJSON();
    return this.create({
      endpoint: 'feedbacks',
      data: JSON.stringify(data, null, 2)
    });
  }
}
