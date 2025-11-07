/**
 * POST /api/file-processing/extract
 * Extract text from a PDF document
 * Note: TXT files are already extracted at upload time
 * Note: Metadata extraction is now a separate endpoint
 */

import { convertPdfToMarkdown } from '@openvaa/file-processing';
import { LLMProvider } from '@openvaa/llm-refactor';
import { json } from '@sveltejs/kit';
import { randomUUID } from 'crypto';
import { documentStore } from '$lib/server/fileProcessingStore';
import { LLM_GEMINI_API_KEY } from '../../../../apiKeys';
import type { ExtractRequest, ExtractResponse } from '$lib/api/file-processing/types';

export async function POST({ request }: { request: Request }) {
  try {
    const body = (await request.json()) as ExtractRequest;
    const { documentId, processingOptions } = body;

    const document = documentStore.get(documentId);
    if (!document) {
      return json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.state !== 'REQUIRES_TEXT_EXTRACTION') {
      return json({ error: 'Document must be in REQUIRES_TEXT_EXTRACTION state' }, { status: 400 });
    }

    // Only PDFs should be in this state
    if (document.fileType !== 'pdf') {
      return json({ error: 'Only PDF files require text extraction' }, { status: 400 });
    }

    const fileBuffer = documentStore.getFileBuffer(documentId);
    if (!fileBuffer) {
      return json({ error: 'File buffer not found' }, { status: 404 });
    }

    // Store processing options
    if (processingOptions) {
      documentStore.update(documentId, {
        processingOptions: {
          auto_extract_text: processingOptions.auto_extract_text ?? false,
          auto_segment_text: processingOptions.auto_segment_text ?? false
        }
      });
    }

    // Update state to EXTRACTING
    documentStore.update(documentId, { state: 'EXTRACTING' });

    // Initialize LLM provider for PDF conversion
    const llmProvider = new LLMProvider({
      provider: 'google',
      apiKey: LLM_GEMINI_API_KEY,
      modelConfig: {
        primary: 'gemini-2.5-pro',
        useCachedInput: false
      }
    });

    // Convert PDF to markdown
    const result = await convertPdfToMarkdown({
      runId: randomUUID(),
      pdfBuffer: fileBuffer,
      llmProvider,
      originalFileName: document.filename
    });

    const extractedText = result.data.markdown;
    const extractionMetrics = result.llmMetrics;

    // Determine next state based on auto_extract_text flag
    const autoExtract = processingOptions?.auto_extract_text ?? false;
    const nextState = autoExtract ? 'REQUIRES_SEGMENTATION' : 'AWAITING_TEXT_APPROVAL';

    // Update document with extracted text
    documentStore.update(documentId, {
      extractedText,
      state: nextState,
      metrics: {
        extraction: extractionMetrics
      }
    });

    const response: ExtractResponse = {
      documentId,
      extractedText,
      metrics: {
        extraction: extractionMetrics
      },
      state: nextState
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
