/**
 * POST /api/file-processing/re-review-segmentation
 * Allow manual review of an auto-approved segmentation
 */

import { json } from '@sveltejs/kit';
import { documentStore } from '$lib/server/fileProcessingStore';
import type { ReReviewRequest } from '$lib/api/file-processing/types';

export async function POST({ request }: { request: Request }) {
  try {
    const body = (await request.json()) as ReReviewRequest;
    const { documentId } = body;

    const document = documentStore.get(documentId);
    if (!document) {
      return json({ error: 'Document not found' }, { status: 404 });
    }

    // Can re-review from any state after segmentation
    if (!document.segments) {
      return json({ error: 'No segments to review' }, { status: 400 });
    }

    // Move back to AWAITING_SEGMENTATION_APPROVAL state
    const updated = documentStore.update(documentId, {
      state: 'AWAITING_SEGMENTATION_APPROVAL'
    });

    return json(updated);
  } catch (error) {
    console.error('Re-review segmentation error:', error);
    return json({ error: 'Failed to re-review segmentation' }, { status: 500 });
  }
}
