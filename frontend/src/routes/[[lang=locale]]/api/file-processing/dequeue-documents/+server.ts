/**
 * POST /api/file-processing/dequeue-documents
 * Move documents from QUEUED_FOR_EXTRACTION back to UPLOADED state
 */

import { json } from '@sveltejs/kit';
import { documentStore } from '$lib/server/fileProcessingStore';
import type { DequeueDocumentsRequest, DequeueDocumentsResponse } from '$lib/api/file-processing/types';

export async function POST({ request }: { request: Request }) {
  try {
    const body = (await request.json()) as DequeueDocumentsRequest;
    const { documentIds } = body;

    if (!documentIds || documentIds.length === 0) {
      return json({ error: 'No document IDs provided' }, { status: 400 });
    }

    const dequeuedDocuments = [];

    for (const documentId of documentIds) {
      const document = documentStore.get(documentId);
      if (!document) {
        console.warn(`Document not found: ${documentId}`);
        continue;
      }

      if (document.state !== 'QUEUED_FOR_EXTRACTION') {
        console.warn(`Document ${documentId} is not in QUEUED_FOR_EXTRACTION state, skipping`);
        continue;
      }

      const updated = documentStore.update(documentId, {
        state: 'UPLOADED'
      });

      if (updated) {
        dequeuedDocuments.push(updated);
      }
    }

    const response: DequeueDocumentsResponse = {
      dequeuedDocuments
    };

    return json(response);
  } catch (error) {
    console.error('Dequeue documents error:', error);
    return json(
      { error: `Failed to dequeue documents: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
