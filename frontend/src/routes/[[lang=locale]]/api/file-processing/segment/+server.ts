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

    if (document.state !== 'EXTRACTION_APPROVED') {
      return json({ error: 'Extraction must be approved before segmentation' }, { status: 400 });
    }

    if (!document.extractedText) {
      return json({ error: 'No extracted text available' }, { status: 400 });
    }

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

    // Update document with segments
    documentStore.update(documentId, {
      segments,
      state: 'SEGMENTED',
      metrics: {
        ...document.metrics,
        segmentation: metrics
      }
    });

    const response: SegmentResponse = {
      documentId,
      segments,
      metrics,
      state: 'SEGMENTED'
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
