/**
 * POST /api/file-processing/approve-metadata
 * Approve metadata (with optional edits) and trigger segmentation
 */

import { json } from '@sveltejs/kit';
import { documentStore } from '$lib/server/fileProcessingStore';
import type { ApproveMetadataRequest } from '$lib/api/file-processing/types';

export async function POST({ request }: { request: Request }) {
  try {
    const body = (await request.json()) as ApproveMetadataRequest;
    const { documentId, metadata } = body;

    const document = documentStore.get(documentId);
    if (!document) {
      return json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.state !== 'METADATA_INSERTION') {
      return json({ error: 'Document must be in METADATA_INSERTION state' }, { status: 400 });
    }

    // Save the approved metadata
    const updated = documentStore.update(documentId, {
      metadata,
      state: 'METADATA_APPROVED'
    });

    return json(updated);
  } catch (error) {
    console.error('Approve metadata error:', error);
    return json(
      { error: `Failed to approve metadata: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
