import type { FeedbackData } from './dataProvider/dataProvider';
import { dataProvider } from './getData';
import { browser } from '$app/environment';

export async function sendFeedback(
  rating?: FeedbackData['rating'],
  description?: FeedbackData['description']
): Promise<Response | undefined> {
  if (!browser) return Promise.resolve(undefined);
  const { setFeedback } = await dataProvider;
  const data: FeedbackData = {
    rating,
    description,
    date: new Date(),
    url: window?.location?.href,
    userAgent: navigator?.userAgent
  };
  return setFeedback(data);
}
