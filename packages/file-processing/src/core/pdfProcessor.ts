import { GoogleGenAI } from '@google/genai';
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
  const { pdfBuffer, apiKey, model = 'gemini-2.5-pro', originalFileName } = options;

  // Load the prompt from YAML
  const promptData = await loadPrompt({ promptFileName: 'pdfToMarkdown' });

  // Initialize Gemini AI
  const ai = new GoogleGenAI({ apiKey: apiKey || process.env.LLM_GEMINI_API_KEY || '' });

  if (!ai) {
    throw new Error('Gemini API key is required. Provide it via options.apiKey or LLM_GEMINI_API_KEY env variable.');
  }

  // Convert buffer to base64
  const base64Data = pdfBuffer.toString('base64');

  // Prepare content for Gemini
  const contents = [
    { text: promptData.prompt },
    {
      inlineData: {
        mimeType: 'application/pdf',
        data: base64Data
      }
    }
  ];

  // Call Gemini API
  const response = await ai.models.generateContent({
    model,
    contents
  });

  const markdownContent = response.text?.trim() || '';

  if (!markdownContent) {
    throw new Error('Failed to extract markdown content from PDF');
  }

  return {
    markdown: markdownContent,
    metadata: {
      originalFileName,
      processingTimestamp: new Date().toISOString(),
      modelUsed: model
    }
  };
}
