/**
 * POST /api/file-processing/metadata
 * Submit metadata for a document
 */

import { json } from '@sveltejs/kit';
import { documentStore } from '$lib/server/fileProcessingStore';
import type { MetadataRequest } from '$lib/api/file-processing/types';

 
export async function POST({ request }: { request: Request }) {
  try {
    const body = (await request.json()) as MetadataRequest;
    const { documentId, metadata } = body;

    const document = documentStore.get(documentId);
    if (!document) {
      return json({ error: 'Document not found' }, { status: 404 });
    }

    // Update document with metadata
    const updated = documentStore.update(documentId, {
      metadata,
      state: 'METADATA_ENTERED'
    });

    return json(updated);
  } catch (error) {
    console.error('Metadata error:', error);
    return json({ error: 'Failed to save metadata' }, { status: 500 });
  }
}
