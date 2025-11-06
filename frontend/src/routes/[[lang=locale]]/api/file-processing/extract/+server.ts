/**
 * POST /api/file-processing/extract
 * Extract text from a document (PDF to markdown, or read TXT directly)
 * Also extracts metadata in parallel
 */

import { convertPdfToMarkdown, extractMetadata } from '@openvaa/file-processing';
import { LLMProvider } from '@openvaa/llm-refactor';
import { json } from '@sveltejs/kit';
import { randomUUID } from 'crypto';
import { documentStore } from '$lib/server/fileProcessingStore';
import { LLM_GEMINI_API_KEY } from '../../../../apiKeys';
import type { ExtractRequest, ExtractResponse } from '$lib/api/file-processing/types';

export async function POST({ request }: { request: Request }) {
  try {
    const body = (await request.json()) as ExtractRequest;
    const { documentId } = body;

    const document = documentStore.get(documentId);
    if (!document) {
      return json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.state !== 'QUEUED_FOR_EXTRACTION' && document.state !== 'UPLOADED') {
      return json({ error: 'Document must be uploaded or queued for extraction' }, { status: 400 });
    }

    const fileBuffer = documentStore.getFileBuffer(documentId);
    if (!fileBuffer) {
      return json({ error: 'File buffer not found' }, { status: 404 });
    }

    // Initialize LLM provider for PDF conversion and metadata extraction
    const llmProvider = new LLMProvider({
      provider: 'google',
      apiKey: LLM_GEMINI_API_KEY,
      modelConfig: {
        primary: 'gemini-2.5-pro',
        useCachedInput: false
      }
    });

    let extractedText: string;
    let extractionMetrics;

    // Extract text based on file type
    if (document.fileType === 'pdf') {
      // Convert PDF to markdown
      const result = await convertPdfToMarkdown({
        runId: randomUUID(),
        pdfBuffer: fileBuffer,
        llmProvider,
        originalFileName: document.filename
      });

      extractedText = result.data.markdown;
      extractionMetrics = result.llmMetrics;
    } else {
      // TXT file - just decode as UTF-8
      extractedText = fileBuffer.toString('utf-8');
      extractionMetrics = {
        processingTimeMs: 0,
        nLlmCalls: 0,
        costs: { total: 0, input: 0, output: 0 },
        tokens: { totalTokens: 0, inputTokens: 0, outputTokens: 0 }
      };
    }

    // Extract metadata from the text (runs in parallel with any post-processing if needed)
    // Note: For true parallelism in PDF case, we'd need to refactor convertPdfToMarkdown
    // to expose the text earlier, but for now metadata extraction happens immediately after
    const metadataExtractionPromise = extractMetadata({
      text: extractedText,
      llmProvider,
      runId: randomUUID()
    });

    // Wait for metadata extraction to complete
    const { metadata: extractedMetadataRaw, response: metadataResponse } = await metadataExtractionPromise;

    const metadataMetrics = {
      processingTimeMs: metadataResponse.finishReason ? 0 : 0, // Response doesn't include time
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

    // Update document with extracted text and metadata
    documentStore.update(documentId, {
      extractedText,
      extractedMetadata: extractedMetadataFormatted,
      state: 'EXTRACTED',
      metrics: {
        extraction: extractionMetrics,
        metadataExtraction: metadataMetrics
      }
    });

    const response: ExtractResponse = {
      documentId,
      extractedText,
      extractedMetadata: extractedMetadataFormatted,
      metrics: {
        extraction: extractionMetrics,
        metadataExtraction: metadataMetrics
      },
      state: 'EXTRACTED'
    };

    return json(response);
  } catch (error) {
    console.error('Extraction error:', error);
    return json(
      { error: `Failed to extract text: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
