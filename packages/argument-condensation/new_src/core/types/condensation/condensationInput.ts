import { LLMProvider } from '@openvaa/llm';
import { CondensationOutputType } from './condensationType';
import { ProcessingStep } from './processDefinition';
import { SupportedQuestion } from '../base/supportedQuestion';
/**
 * Represents a single non-empty comment given by a candidate in the VAA.
 * @param id - Unique identifier
 * @param candidateID - The candidate who wrote the comment
 * @param candidateAnswer - Can be Likert number, categorical number, or categorical string
 * @param text - The actual comment
 */
export interface VAAComment {
  id: string;
  candidateID: string;
  candidateAnswer: number | string;
  text: string;
}

/**
 * Options for question condensation
 */
export interface CondensationOptions {
  llmProvider: LLMProvider;
  language: string;
  outputType: CondensationOutputType;
  processingSteps?: Array<ProcessingStep>;
  model?: string;
  fallbackModel?: string; // For parallelization (alternates between models to avoid rate limiting)
  runId?: string;
  electionId?: string;
  maxCommentsPerGroup?: number;
}

/**
 * Input parameters for the condensation process.
 * @param question - The topic/question these comments relate to
 * @param comments - Array of comments to process
 * @param options - Options for the condensation process
 */
export interface CondensationRunInput {
  question: SupportedQuestion;
  comments: Array<VAAComment>;
  options: CondensationOptions;
}
