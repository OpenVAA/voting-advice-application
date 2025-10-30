/**
 * GET /api/file-processing/queue
 * Get all documents in the processing queue
 */

import { json } from '@sveltejs/kit';
import { documentStore } from '$lib/server/fileProcessingStore';
import type { QueueResponse } from '$lib/api/file-processing/types';

export async function GET() {
  try {
    const documents = documentStore.getQueue();
    const failedDocuments = documentStore.getFailedQueue();

    const response: QueueResponse = {
      documents,
      failedDocuments
    };

    return json(response);
  } catch (error) {
    console.error('Queue retrieval error:', error);
    return json({ error: 'Failed to retrieve queue' }, { status: 500 });
  }
}
