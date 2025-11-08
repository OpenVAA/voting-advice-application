/**
 * File processing page server functions
 * - Loads document list server-side for SSR
 * - Provides form actions for mutations following SvelteKit patterns
 */

import { error, fail } from '@sveltejs/kit';
import { documentStore } from '$lib/server/fileProcessingStore';
import type { DocumentMetadata } from '$lib/api/file-processing/types';
import type { Actions } from './$types';

/**
 * Load documents server-side for initial page render
 * Declares dependency on 'app:documents' for invalidation
 */
export async function load({ depends }) {
  // Declare dependency so invalidate('app:documents') triggers reload
  depends('app:documents');

  try {
    const documents = documentStore.getQueue();
    const failedDocuments = documentStore.getFailedQueue();

    return {
      documents,
      failedDocuments
    };
  } catch (err) {
    error(500, { message: 'Failed to load documents' });
  }
}

/**
 * Form actions for document processing mutations
 * Following pattern from candidate routes
 */
export const actions = {
  /**
   * Approve extraction (with optional edits)
   * Moves document from AWAITING_TEXT_APPROVAL to REQUIRES_SEGMENTATION
   */
  approveExtraction: async ({ request }) => {
    const data = await request.formData();
    const documentId = data.get('documentId') as string;
    const editedText = data.get('editedText') as string | null;
    const autoSegmentText = data.get('autoSegmentText') === 'true';

    const document = documentStore.get(documentId);
    if (!document) {
      return fail(404, { error: 'Document not found' });
    }

    if (document.state !== 'AWAITING_TEXT_APPROVAL') {
      return fail(400, { error: 'Document must be in AWAITING_TEXT_APPROVAL state' });
    }

    try {
      // Merge processing options (preserve existing options)
      const mergedProcessingOptions = {
        auto_extract_text: document.processingOptions?.auto_extract_text ?? false,
        auto_segment_text: autoSegmentText
      };

      const updated = documentStore.update(documentId, {
        extractedText: editedText || document.extractedText,
        processingOptions: mergedProcessingOptions,
        state: 'REQUIRES_SEGMENTATION'
      });

      return { success: true, document: updated };
    } catch (err) {
      return fail(500, { error: 'Failed to approve extraction' });
    }
  },

  /**
   * Approve segmentation (with optional edits)
   * Moves document from AWAITING_SEGMENTATION_APPROVAL to REQUIRES_METADATA_EXTRACTION
   */
  approveSegmentation: async ({ request }) => {
    const data = await request.formData();
    const documentId = data.get('documentId') as string;
    const segmentsJson = data.get('segments') as string | null;

    const document = documentStore.get(documentId);
    if (!document) {
      return fail(404, { error: 'Document not found' });
    }

    if (document.state !== 'AWAITING_SEGMENTATION_APPROVAL') {
      return fail(400, { error: 'Document must be in AWAITING_SEGMENTATION_APPROVAL state' });
    }

    try {
      // Parse edited segments if provided
      const segments = segmentsJson ? JSON.parse(segmentsJson) : document.segments;

      const updated = documentStore.update(documentId, {
        segments,
        state: 'REQUIRES_METADATA_EXTRACTION'
      });

      return { success: true, document: updated };
    } catch (err) {
      return fail(500, { error: 'Failed to approve segmentation' });
    }
  },

  /**
   * Approve metadata (final step)
   * Moves document from AWAITING_METADATA_APPROVAL to COMPLETED
   */
  approveMetadata: async ({ request }) => {
    const data = await request.formData();
    const documentId = data.get('documentId') as string;
    const metadataJson = data.get('metadata') as string;

    const document = documentStore.get(documentId);
    if (!document) {
      return fail(404, { error: 'Document not found' });
    }

    if (document.state !== 'AWAITING_METADATA_APPROVAL') {
      return fail(400, { error: 'Document must be in AWAITING_METADATA_APPROVAL state' });
    }

    try {
      const metadata = JSON.parse(metadataJson) as DocumentMetadata;

      const updated = documentStore.update(documentId, {
        metadata,
        state: 'COMPLETED'
      });

      return { success: true, document: updated };
    } catch (err) {
      return fail(500, {
        error: `Failed to approve metadata: ${err instanceof Error ? err.message : 'Unknown error'}`
      });
    }
  },

  /**
   * Mark document as failed at any stage
   */
  fail: async ({ request }) => {
    const data = await request.formData();
    const documentId = data.get('documentId') as string;
    const reason = data.get('reason') as string;
    const stage = data.get('stage') as string;

    const document = documentStore.get(documentId);
    if (!document) {
      return fail(404, { error: 'Document not found' });
    }

    if (!reason || !reason.trim()) {
      return fail(400, { error: 'Failure reason is required' });
    }

    try {
      const updated = documentStore.update(documentId, {
        state: 'FAILED',
        failureReason: reason,
        failureStage: stage
      });

      return { success: true, document: updated };
    } catch (err) {
      return fail(500, { error: 'Failed to mark document as failed' });
    }
  },

  /**
   * Delete a document permanently
   */
  delete: async ({ request }) => {
    const data = await request.formData();
    const documentId = data.get('documentId') as string;

    const document = documentStore.get(documentId);
    if (!document) {
      return fail(404, { error: 'Document not found' });
    }

    try {
      documentStore.delete(documentId);
      return { success: true };
    } catch (err) {
      return fail(500, { error: 'Failed to delete document' });
    }
  }
} satisfies Actions;
