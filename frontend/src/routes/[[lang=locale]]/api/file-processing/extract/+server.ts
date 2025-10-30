/**
 * POST /api/file-processing/extract
 * Extract text from a document (PDF to markdown, or read TXT directly)
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
    const { documentId } = body;

    const document = documentStore.get(documentId);
    if (!document) {
      return json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.state !== 'METADATA_ENTERED') {
      return json({ error: 'Document must have metadata before extraction' }, { status: 400 });
    }

    const fileBuffer = documentStore.getFileBuffer(documentId);
    if (!fileBuffer) {
      return json({ error: 'File buffer not found' }, { status: 404 });
    }

    let extractedText: string;
    let metrics;

    // Initialize LLM provider for PDF conversion
    const llmProvider = new LLMProvider({
      provider: 'google',
      apiKey: LLM_GEMINI_API_KEY,
      modelConfig: {
        primary: 'gemini-2.5-pro',
        useCachedInput: false
      }
    });

    if (document.fileType === 'pdf') {
      // Convert PDF to markdown
      const result = await convertPdfToMarkdown({
        runId: randomUUID(),
        pdfBuffer: fileBuffer,
        llmProvider,
        originalFileName: document.filename
      });

      extractedText = result.data.markdown;
      metrics = result.llmMetrics;
    } else {
      // TXT file - just decode as UTF-8
      extractedText = fileBuffer.toString('utf-8');
      metrics = {
        processingTimeMs: 0,
        nLlmCalls: 0,
        costs: { total: 0, input: 0, output: 0 },
        tokens: { totalTokens: 0, inputTokens: 0, outputTokens: 0 }
      };
    }

    // Update document with extracted text
    documentStore.update(documentId, {
      extractedText,
      state: 'EXTRACTED',
      metrics: {
        extraction: metrics
      }
    });

    const response: ExtractResponse = {
      documentId,
      extractedText,
      metrics,
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
