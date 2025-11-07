/**
 * POST /api/file-processing/extract-metadata
 * Extract metadata from document text as a separate LLM operation
 */

import { extractMetadata } from '@openvaa/file-processing';
import { LLMProvider } from '@openvaa/llm-refactor';
import { json } from '@sveltejs/kit';
import { randomUUID } from 'crypto';
import { documentStore } from '$lib/server/fileProcessingStore';
import { LLM_GEMINI_API_KEY } from '../../../../apiKeys';
import type { ExtractMetadataRequest, ExtractMetadataResponse } from '$lib/api/file-processing/types';

export async function POST({ request }: { request: Request }) {
  try {
    const body = (await request.json()) as ExtractMetadataRequest;
    const { documentId } = body;

    const document = documentStore.get(documentId);
    if (!document) {
      return json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.state !== 'REQUIRES_METADATA_EXTRACTION') {
      return json({ error: 'Document must be in REQUIRES_METADATA_EXTRACTION state' }, { status: 400 });
    }

    if (!document.extractedText) {
      return json({ error: 'No extracted text available' }, { status: 400 });
    }

    // Update state to EXTRACTING_METADATA
    documentStore.update(documentId, { state: 'EXTRACTING_METADATA' });

    // Initialize LLM provider for metadata extraction
    const llmProvider = new LLMProvider({
      provider: 'google',
      apiKey: LLM_GEMINI_API_KEY,
      modelConfig: {
        primary: 'gemini-2.5-pro',
        useCachedInput: false
      }
    });

    // Extract metadata from the text
    const { metadata: extractedMetadataRaw, response: metadataResponse } = await extractMetadata({
      text: document.extractedText,
      llmProvider,
      runId: randomUUID()
    });

    const metadataMetrics = {
      processingTimeMs: 0, // Response doesn't include time
      nLlmCalls: 1,
      costs: metadataResponse.costs,
      tokens: metadataResponse.usage
    };

    // Convert extracted metadata to DocumentMetadata format
    const extractedMetadataFormatted = {
      title: extractedMetadataRaw.title,
      authors: extractedMetadataRaw.authors,
      source: extractedMetadataRaw.link || extractedMetadataRaw.source,
      publishedDate: extractedMetadataRaw.publishedDate,
      documentType: 'unofficial' as const,
      locale: extractedMetadataRaw.locale
    };

    // Update document with extracted metadata and move to AWAITING_METADATA_APPROVAL
    documentStore.update(documentId, {
      extractedMetadata: extractedMetadataFormatted,
      state: 'AWAITING_METADATA_APPROVAL',
      metrics: {
        ...document.metrics,
        metadataExtraction: metadataMetrics
      }
    });

    const response: ExtractMetadataResponse = {
      documentId,
      extractedMetadata: extractedMetadataFormatted,
      metrics: metadataMetrics,
      state: 'AWAITING_METADATA_APPROVAL'
    };

    return json(response);
  } catch (error) {
    console.error('Metadata extraction error:', error);
    return json(
      { error: `Failed to extract metadata: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
