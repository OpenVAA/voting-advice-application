/**
 * An generic API route for posting feedback with server-dependent FeedbackWriters.
 */

import { error } from '@sveltejs/kit';
import { feedbackWriter } from '$lib/server/api/feedbackWriter';
import type { FeedbackData } from '$lib/api/base/feedbackWriter.type.js';

export async function POST({ request }) {
  if (!feedbackWriter) error(500, 'No server feedback writer available');

  const data: FeedbackData = await request.json().catch(() => error(500, 'Error when parsing feedback'));

  return feedbackWriter.postFeedback(data).catch(() => error(500, 'Failed to send feedback'));
}
