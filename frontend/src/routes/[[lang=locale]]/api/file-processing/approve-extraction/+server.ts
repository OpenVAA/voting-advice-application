/**
 * POST /api/file-processing/approve-extraction
 * Approve extracted text (with optional edits) and move to next stage
 */

import { json } from '@sveltejs/kit';
import { documentStore } from '$lib/server/fileProcessingStore';
import type { ApproveExtractionRequest } from '$lib/api/file-processing/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST({ request }: { request: Request }) {
  try {
    const body = (await request.json()) as ApproveExtractionRequest;
    const { documentId, editedText } = body;

    const document = documentStore.get(documentId);
    if (!document) {
      return json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.state !== 'EXTRACTED') {
      return json({ error: 'Document must be in EXTRACTED state' }, { status: 400 });
    }

    // Use edited text if provided, otherwise keep original
    const finalText = editedText !== undefined ? editedText : document.extractedText;

    const updated = documentStore.update(documentId, {
      extractedText: finalText,
      state: 'EXTRACTION_APPROVED'
    });

    return json(updated);
  } catch (error) {
    console.error('Approve extraction error:', error);
    return json({ error: 'Failed to approve extraction' }, { status: 500 });
  }
}
