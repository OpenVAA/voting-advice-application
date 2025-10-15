import type { SegmentTextOptions, SegmentTextResult } from './textSegmentation.type.js';
/**
 * Segment text into logical chunks using LLM
 *
 * @param options - Segmentation options
 * @returns Segmented text with metadata
 *
 * @example
 * ```typescript
 * const result = await segmentText({
 *   text: markdownContent,
 *   llmProvider: provider,
 *   modelConfig: { primary: 'gemini-2.5-flash-preview-09-2025' },
 *   minSegmentLength: 300,
 *   maxSegmentLength: 2500,
 *   charsPerLLMCall: 10000,
 *   validateTextPreservation: false
 * });
 *
 * const printResult = {
 *   segments: [
 *     'Segment 1',
 *     'Segment 2',
 *     'Segment 3',
 *   ],
 *   metadata: {
 *     segmentCount: 3,
 *     totalCharacters: 1000,
 *     averageSegmentLength: 333.33,
 *     minSegmentLength: 300,
 *     maxSegmentLength: 2500,
 *     costs: {
 *       total: 0.21,
 *       currency: 'USD'
 *     },
 *     processingTimeMs: 1000
 *   }
 * }
 * ```
 */
export declare function segmentText(options: SegmentTextOptions): Promise<SegmentTextResult>;
//# sourceMappingURL=textSegmentation.d.ts.map