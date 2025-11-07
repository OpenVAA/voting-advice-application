/**
 * POST /api/file-processing/re-review-extraction
 * Allow manual review of an auto-approved text extraction
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

    // Can re-review from any state after extraction
    if (!document.extractedText) {
      return json({ error: 'No extracted text to review' }, { status: 400 });
    }

    // Move back to AWAITING_TEXT_APPROVAL state
    const updated = documentStore.update(documentId, {
      state: 'AWAITING_TEXT_APPROVAL'
    });

    return json(updated);
  } catch (error) {
    console.error('Re-review extraction error:', error);
    return json({ error: 'Failed to re-review extraction' }, { status: 500 });
  }
}
