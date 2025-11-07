/**
 * POST /api/file-processing/segment
 * Segment text into logical chunks using LLM
 */

import { segmentText } from '@openvaa/file-processing';
import { LLMProvider } from '@openvaa/llm-refactor';
import { json } from '@sveltejs/kit';
import { randomUUID } from 'crypto';
import { documentStore } from '$lib/server/fileProcessingStore';
import { LLM_OPENAI_API_KEY } from '../../../../apiKeys';
import type { SegmentRequest, SegmentResponse } from '$lib/api/file-processing/types';

export async function POST({ request }: { request: Request }) {
  try {
    const body = (await request.json()) as SegmentRequest;
    const { documentId, options } = body;

    const document = documentStore.get(documentId);
    if (!document) {
      return json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.state !== 'REQUIRES_SEGMENTATION') {
      return json({ error: 'Document must be in REQUIRES_SEGMENTATION state' }, { status: 400 });
    }

    if (!document.extractedText) {
      return json({ error: 'No extracted text available' }, { status: 400 });
    }

    // Update state to SEGMENTING
    documentStore.update(documentId, { state: 'SEGMENTING' });

    // Initialize LLM provider for segmentation
    const llmProvider = new LLMProvider({
      provider: 'openai',
      apiKey: LLM_OPENAI_API_KEY,
      modelConfig: {
        primary: 'gpt-4o-mini',
        useCachedInput: false
      }
    });

    // Segment the text
    const result = await segmentText({
      runId: randomUUID(),
      text: document.extractedText,
      llmProvider,
      documentId,
      minSegmentLength: options?.minSegmentLength ?? 500,
      maxSegmentLength: options?.maxSegmentLength ?? 1000,
      validateTextPreservation: false // Disabled for MVP
    });

    const segments = result.data.segments;
    const metrics = result.data.metrics;

    // Get fresh document to check processing options
    const updatedDocument = documentStore.get(documentId);
    const autoSegment = updatedDocument?.processingOptions?.auto_segment_text ?? false;

    // Determine next state based on auto_segment_text flag
    const nextState = autoSegment ? 'REQUIRES_METADATA_EXTRACTION' : 'AWAITING_SEGMENTATION_APPROVAL';

    // Update document with segments
    documentStore.update(documentId, {
      segments,
      state: nextState,
      metrics: {
        ...document.metrics,
        segmentation: metrics
      }
    });

    const response: SegmentResponse = {
      documentId,
      segments,
      metrics,
      state: nextState
    };

    return json(response);
  } catch (error) {
    console.error('Segmentation error:', error);
    return json(
      { error: `Failed to segment text: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
