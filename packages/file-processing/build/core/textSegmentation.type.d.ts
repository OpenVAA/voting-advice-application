import type { LLMModelConfig, LLMProvider } from '@openvaa/llm-refactor';
export interface SegmentationOptions {
    /** The text to segment */
    text: string;
    /** LLM provider instance for making API calls */
    llmProvider: LLMProvider;
    /** Model configuration */
    modelConfig: LLMModelConfig;
    /** To prevent context window issues, we need to split the text. */
    charsPerLLMCall?: number;
    /** Guidance length min */
    minSegmentLength?: number;
    /** Guidance length max */
    maxSegmentLength?: number;
    /** Optional: Validate text preservation (default: true) */
    validateTextPreservation?: boolean;
}
/** @example
 * ```typescript
 * {
 *   segments: [
 *     'Segment 1',
 *     'Segment 2',
 *     'Segment 3',
 *   ],
 * }
 * metadata: {
 *   segmentCount: 3,
 *   totalCharacters: 1000,
 *   averageSegmentLength: 333.33,
 *   minSegmentLength: 300,
 *   maxSegmentLength: 2500,
 *   costs: {
 *     total: 100,
 *     currency: 'USD'
 *   }
 * }
 * ```
 */
export interface SegmentationResult {
    /** Array of text segments */
    segments: Array<string>;
    /** Segmentation metadata */
    metadata: {
        segmentCount: number;
        totalCharacters: number;
        averageSegmentLength: number;
        minSegmentLength: number;
        maxSegmentLength: number;
        costs: {
            total: number;
            currency: 'USD';
        };
    };
}
//# sourceMappingURL=textSegmentation.type.d.ts.map