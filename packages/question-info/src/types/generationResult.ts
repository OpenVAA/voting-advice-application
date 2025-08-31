import type { QuestionInfoSection, TermDefinition } from '@openvaa/app-shared';
import type { Id } from '@openvaa/core';
import type { GenerationMetrics } from '@openvaa/llm';

// ------------------------------------------------------------------
// Types for all possible generation response formats in this package
// -----------------------------------------------------------------

// Define the possible return types based on operations
export type InfoSectionsOnly = {
  infoSections: Array<QuestionInfoSection>;
};

export type TermsOnly = {
  terms: Array<TermDefinition>;
};

export type BothOperations = {
  infoSections: Array<QuestionInfoSection>;
  terms: Array<TermDefinition>;
};

export type ResponseWithInfo = InfoSectionsOnly | TermsOnly | BothOperations;


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
