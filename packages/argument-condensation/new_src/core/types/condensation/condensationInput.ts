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
 * @param llmProvider - The LLM provider to use
 * @param language - The language of the comments
 * @param outputType - The type of output to generate
 * @param processingSteps - The steps to process the comments
 * @param llmModel - The LLM model to use
 * @param fallbackModel - The fallback LLM model to use for parallelization
 * @param runId - The ID of the run
 * @param electionId - The ID of the election
 * @param maxCommentsPerGroup - The maximum number of comments to use for a single condensation run
 * @param invertProsAndCons - For ordinal questions invert the pro/con classification
 */
export interface CondensationOptions {
  llmProvider: LLMProvider;
  language: string;
  outputType: CondensationOutputType;
  processingSteps?: Array<ProcessingStep>;
  llmModel?: string;
  fallbackModel?: string; // For parallelization (alternates between models to avoid rate limiting)
  runId?: string;
  electionId?: string;
  maxCommentsPerGroup?: number;
  invertProsAndCons?: boolean; // For ordinal questions, invert the pro/con classification
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
