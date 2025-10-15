import type { ProcessPdfOptions, ProcessPdfResult, ProcessTextOptions, ProcessTextResult } from './api.type.js';
/**
 * Process a document end-to-end: segment and analyze
 * This is a convenience function that chains segmentText and analyzeDocument
 *
 * @param options - Document processing options
 * @returns Complete analysis result
 *
 * @example
 * ```typescript
 * const result = await processText({
 *   text: markdownContent,
 *   llmProvider: provider,
 *   modelConfig: { primary: 'gemini-2.5-flash-preview-09-2025' }
 * });
 * console.log(result.segmentAnalyses);
 * console.log(`Total cost: $${result.processingMetadata.costs.total}`);
 * ```
 */
export declare function processText(options: ProcessTextOptions): Promise<ProcessTextResult>;
export declare function processPdf(options: ProcessPdfOptions): Promise<ProcessPdfResult>;
//# sourceMappingURL=api.d.ts.map