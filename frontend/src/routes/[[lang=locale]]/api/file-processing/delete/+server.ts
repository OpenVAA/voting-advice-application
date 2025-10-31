/**
 * POST /api/file-processing/delete
 * Delete a document and its file buffer from the processing queue
 */

import { json } from '@sveltejs/kit';
import { documentStore } from '$lib/server/fileProcessingStore';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST({ request }: { request: Request }) {
  try {
    const body = await request.json();
    const { documentId } = body;

    if (!documentId) {
      return json({ error: 'Document ID is required' }, { status: 400 });
    }

    const document = documentStore.get(documentId);
    if (!document) {
      return json({ error: 'Document not found' }, { status: 404 });
    }

    const removed = documentStore.remove(documentId);

    if (!removed) {
      return json({ error: 'Failed to delete document' }, { status: 500 });
    }

    return json({ success: true, documentId });
  } catch (error) {
    console.error('Delete document error:', error);
    return json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
