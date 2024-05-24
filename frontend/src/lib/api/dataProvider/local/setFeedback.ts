import {browser} from '$app/environment';
import {API} from '../../api';
import type {FeedbackData} from '../dataProvider';

/**
 * Save feedback to the local API as a fallback if the `setFeedback` method is not provided by the `DataProvider` used.
 */
export function setFeedback(data: FeedbackData): Promise<Response | undefined> {
  if (!browser) return Promise.resolve(undefined);
  const request = {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json'
    }
  };
  return fetch(API.Feedback, request).catch((e) => {
    console.error('Error in posting feedback to local backend: ', e);
    return undefined;
  });
}
