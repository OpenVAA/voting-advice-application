/**
 * POST /api/file-processing/approve-segmentation
 * Approve segmentation (with optional edits) and complete processing
 */

import { json } from '@sveltejs/kit';
import { documentStore } from '$lib/server/fileProcessingStore';
import type { ApproveSegmentationRequest } from '$lib/api/file-processing/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST({ request }: { request: Request }) {
  try {
    const body = (await request.json()) as ApproveSegmentationRequest;
    const { documentId, editedSegments } = body;

    const document = documentStore.get(documentId);
    if (!document) {
      return json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.state !== 'SEGMENTED') {
      return json({ error: 'Document must be in SEGMENTED state' }, { status: 400 });
    }

    // Use edited segments if provided, otherwise keep original
    const finalSegments = editedSegments !== undefined ? editedSegments : document.segments;

    const updated = documentStore.update(documentId, {
      segments: finalSegments,
      state: 'SEGMENTATION_APPROVED'
    });

    return json(updated);
  } catch (error) {
    console.error('Approve segmentation error:', error);
    return json({ error: 'Failed to approve segmentation' }, { status: 500 });
  }
}
