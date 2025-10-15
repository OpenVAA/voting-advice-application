import type { AnalyzeSourceOptions, AnalyzeSourceResult } from './documentAnalysis.type.js';
/**
 * Analyze a document by extracting metadata and analyzing each segment
 *
 * @param options - Document analysis options
 * @returns Complete analysis result with metadata and segment analyses
 *
 * @example
 * ```typescript
 * const result = await analyzeDocument({
 *   fullText: markdownContent,
 *   segments: segmentedText,
 *   llmProvider: provider,
 *   modelConfig: { primary: 'gemini-2.5-flash-preview-09-2025' },
 *   documentId: 'my-doc-123'
 * });
 * console.log(result.segmentAnalyses);
 * ```
 */
export declare function analyzeDocument(options: AnalyzeSourceOptions): Promise<AnalyzeSourceResult>;
//# sourceMappingURL=documentAnalysis.d.ts.map