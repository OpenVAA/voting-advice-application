import type { PdfProcessorOptions, PdfProcessorResult } from './pdfProcessor.type.js';
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
export declare function convertPdfToMarkdown(options: PdfProcessorOptions): Promise<PdfProcessorResult>;
//# sourceMappingURL=pdfProcessor.d.ts.map