/**
 * POST /api/file-processing/extract-batch
 * Process queued documents in batches (extracts text + metadata in parallel)
 */

import { convertPdfToMarkdown, extractMetadata } from '@openvaa/file-processing';
import { LLMProvider } from '@openvaa/llm-refactor';
import { json } from '@sveltejs/kit';
import { randomUUID } from 'crypto';
import { documentStore } from '$lib/server/fileProcessingStore';
import { LLM_GEMINI_API_KEY } from '../../../../apiKeys';
import type { BatchExtractRequest, BatchExtractResponse } from '$lib/api/file-processing/types';

export async function POST({ request }: { request: Request }) {
  try {
    const body = (await request.json()) as BatchExtractRequest;
    const { batchSize = 2 } = body;

    // Get all queued documents
    const allDocuments = documentStore.getQueue();
    const queuedDocuments = allDocuments.filter((doc) => doc.state === 'QUEUED_FOR_EXTRACTION');

    if (queuedDocuments.length === 0) {
      return json({ error: 'No documents in queue for extraction' }, { status: 400 });
    }

    // Take only the batch size
    const documentsToProcess = queuedDocuments.slice(0, batchSize);

    // Initialize LLM provider
    const llmProvider = new LLMProvider({
      provider: 'google',
      apiKey: LLM_GEMINI_API_KEY,
      modelConfig: {
        primary: 'gemini-2.5-pro',
        useCachedInput: false
      }
    });

    // Process documents in parallel (up to batchSize)
    const processPromises = documentsToProcess.map(async (document) => {
      try {
        const fileBuffer = documentStore.getFileBuffer(document.id);
        if (!fileBuffer) {
          console.error(`File buffer not found for document ${document.id}`);
          return null;
        }

        let extractedText: string;
        let extractionMetrics;

        // Extract text based on file type
        if (document.fileType === 'pdf') {
          const result = await convertPdfToMarkdown({
            runId: randomUUID(),
            pdfBuffer: fileBuffer,
            llmProvider,
            originalFileName: document.filename
          });

          extractedText = result.data.markdown;
          extractionMetrics = result.llmMetrics;
        } else {
          extractedText = fileBuffer.toString('utf-8');
          extractionMetrics = {
            processingTimeMs: 0,
            nLlmCalls: 0,
            costs: { total: 0, input: 0, output: 0 },
            tokens: { totalTokens: 0, inputTokens: 0, outputTokens: 0 }
          };
        }

        // Extract metadata from the text
        const { metadata: extractedMetadataRaw, response: metadataResponse } = await extractMetadata({
          text: extractedText,
          llmProvider,
          runId: randomUUID()
        });

        const metadataMetrics = {
          processingTimeMs: 0,
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
        const updated = documentStore.update(document.id, {
          extractedText,
          extractedMetadata: extractedMetadataFormatted,
          state: 'EXTRACTED',
          metrics: {
            extraction: extractionMetrics,
            metadataExtraction: metadataMetrics
          }
        });

        return updated;
      } catch (error) {
        console.error(`Error processing document ${document.id}:`, error);
        return null;
      }
    });

    // Wait for all documents to process
    const results = await Promise.all(processPromises);
    const processedDocuments = results.filter((doc) => doc !== null);

    const response: BatchExtractResponse = {
      processed: processedDocuments.length,
      total: queuedDocuments.length,
      documents: processedDocuments
    };

    return json(response);
  } catch (error) {
    console.error('Batch extraction error:', error);
    return json(
      { error: `Failed to process batch: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
