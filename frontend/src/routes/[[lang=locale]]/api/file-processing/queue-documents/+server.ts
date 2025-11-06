/**
 * POST /api/file-processing/queue-documents
 * Move documents from UPLOADED to QUEUED_FOR_EXTRACTION state
 */

import { json } from '@sveltejs/kit';
import { documentStore } from '$lib/server/fileProcessingStore';
import type { QueueDocumentsRequest, QueueDocumentsResponse } from '$lib/api/file-processing/types';

export async function POST({ request }: { request: Request }) {
  try {
    const body = (await request.json()) as QueueDocumentsRequest;
    const { documentIds } = body;

    if (!documentIds || documentIds.length === 0) {
      return json({ error: 'No document IDs provided' }, { status: 400 });
    }

    const queuedDocuments = [];

    for (const documentId of documentIds) {
      const document = documentStore.get(documentId);
      if (!document) {
        console.warn(`Document not found: ${documentId}`);
        continue;
      }

      if (document.state !== 'UPLOADED') {
        console.warn(`Document ${documentId} is not in UPLOADED state, skipping`);
        continue;
      }

      const updated = documentStore.update(documentId, {
        state: 'QUEUED_FOR_EXTRACTION'
      });

      if (updated) {
        queuedDocuments.push(updated);
      }
    }

    const response: QueueDocumentsResponse = {
      queuedDocuments
    };

    return json(response);
  } catch (error) {
    console.error('Queue documents error:', error);
    return json(
      { error: `Failed to queue documents: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
