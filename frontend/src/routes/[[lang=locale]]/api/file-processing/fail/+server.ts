/**
 * POST /api/file-processing/fail
 * Mark a document as failed with a reason
 */

import { json } from '@sveltejs/kit';
import { documentStore } from '$lib/server/fileProcessingStore';
import type { FailRequest } from '$lib/api/file-processing/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST({ request }: { request: Request }) {
  try {
    const body = (await request.json()) as FailRequest;
    const { documentId, reason, stage } = body;

    const document = documentStore.get(documentId);
    if (!document) {
      return json({ error: 'Document not found' }, { status: 404 });
    }

    const updated = documentStore.update(documentId, {
      state: 'FAILED',
      failureReason: reason,
      failureStage: stage
    });

    return json(updated);
  } catch (error) {
    console.error('Fail document error:', error);
    return json({ error: 'Failed to mark document as failed' }, { status: 500 });
  }
}
