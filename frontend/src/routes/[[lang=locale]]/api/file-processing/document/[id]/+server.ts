/**
 * GET /api/file-processing/document/:id
 * Get a specific document by ID
 */

import { json } from '@sveltejs/kit';
import { documentStore } from '$lib/server/fileProcessingStore';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET({ params }: { params: any }) {
  try {
    const { id } = params;
    const document = documentStore.get(id);

    if (!document) {
      return json({ error: 'Document not found' }, { status: 404 });
    }

    return json({ document });
  } catch (error) {
    console.error('Document retrieval error:', error);
    return json({ error: 'Failed to retrieve document' }, { status: 500 });
  }
}
