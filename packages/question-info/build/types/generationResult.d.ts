import type { QuestionInfoSection, TermDefinition } from '@openvaa/app-shared';
import type { Id } from '@openvaa/core';
import type { GenerationMetrics } from '@openvaa/llm';
/**
 * Result of question info generation
 */
export interface QuestionInfoResult {
    /** Unique identifier for this generation run */
    runId: string;
    /** ID of the question that was processed */
    questionId: Id;
    /** Name of the question */
    questionName: string;
    /** Generated info sections (if requested) */
    infoSections?: Array<QuestionInfoSection>;
    /** Generated terms (if requested) */
    terms?: Array<TermDefinition>;
    /** Generation metrics */
    metrics: GenerationMetrics;
    /** Whether generation was successful */
    success: boolean;
    /** Metadata about the generation run */
    metadata: {
        llmModel: string;
        language: string;
        startTime: Date;
        endTime: Date;
    };
}
//# sourceMappingURL=generationResult.d.ts.map