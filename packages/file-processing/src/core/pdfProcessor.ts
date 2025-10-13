import { LLMProvider } from '@openvaa/llm-refactor';
import { loadPrompt } from '../utils/promptLoader';
import type { PdfProcessorOptions, PdfProcessorResult } from './pdfProcessor.type';

/**
 * Convert a PDF buffer to Markdown using Gemini 2.5 Pro
 *
 * @param options - PDF processor options
 * @returns Markdown content and metadata
 *
 * @example
 * ```typescript
 * const result = await convertPdfToMarkdown({
 *   pdfBuffer: uploadedFile,
 *   apiKey: process.env.GEMINI_KEY,
 *   originalFileName: 'document.pdf'
 * });
 * console.log(result.markdown);
 * ```
 */
export async function convertPdfToMarkdown(options: PdfProcessorOptions): Promise<PdfProcessorResult> {
  const { pdfBuffer, apiKey, model = 'gemini-2.0-flash-exp', originalFileName } = options;

  // Load the prompt from YAML
  const promptData = await loadPrompt({ promptFileName: 'pdfToMarkdown' });

  // Initialize LLM provider with Google
  const llm = new LLMProvider({
    provider: 'google',
    apiKey: apiKey || '',
    modelConfig: {
      primary: model
    }
  });

  // Convert buffer to base64
  const base64Data = pdfBuffer.toString('base64');

  // TODO: use generateText instead of streaming (llmRefactor should support it)
  // Out of personal interest, find out how streaming vs. waiting for generatedText is different.
  const result = llm.streamText({ // = streamText<undefined> because no tools are used
    modelConfig: { primary: model },
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: promptData.prompt },
          {
            type: 'file',
            data: base64Data,
            mediaType: 'application/pdf'
          }
        ]
      }
    ]
  });

  // Get the complete text from the stream
  const markdownContent = await result.text;

  if (!markdownContent?.trim()) {
    throw new Error('Failed to extract markdown content from PDF');
  }

  // Get costs after stream completes
  const costs = await result.costs;

  return {
    markdown: markdownContent.trim(),
    metadata: {
      originalFileName,
      processingTimestamp: new Date().toISOString(),
      modelUsed: model,
      costs: {
        input: costs.input,
        output: costs.output,
        total: costs.total
      }
    }
  };
}
