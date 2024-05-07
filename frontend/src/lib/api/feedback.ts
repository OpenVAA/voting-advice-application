import {browser} from '$app/environment';
import {constants} from '$lib/utils/constants';
import type {StrapiFeedbackData} from './getData.type';

const url = new URL(constants.PUBLIC_BACKEND_URL);
url.pathname = 'api/feedbacks';
const FEEDBACK_URL = url.toString();

/**
 * Send feedback to the backend.
 * @param rating A number between 1 and 5.
 * @param description A text description of the feedback.
 * @returns A promise that resolves to the response or `undefined` if the request fails.
 */
export async function sendFeedback(
  rating?: number,
  description?: string
): Promise<Response | undefined> {
  if (!browser) return undefined;
  return await fetch(FEEDBACK_URL, {
    method: 'POST',
    body: JSON.stringify({
      data: {
        rating,
        description,
        date: new Date(),
        url: window?.location?.href,
        userAgent: navigator?.userAgent
      } as StrapiFeedbackData['attributes']
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  }).catch((e) => {
    console.error('Error in posting feedback to backend: ', e);
    return undefined;
  });
}
