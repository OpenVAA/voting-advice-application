import { LLMProvider } from '@openvaa/llm';
import { CondensationOutputType } from './condensationType';
import { ProcessingStep } from './processDefinition';
import { SupportedQuestion } from '../base/supportedQuestion';
/**
 * Represents a single non-empty comment given by a candidate in the VAA.
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
  /** The LLM provider to use */
  llmProvider: LLMProvider;
  /** The language of the comments */
  language: string;
  /** The type of output to generate */
  outputType: CondensationOutputType;
  /** The steps to process the comments */
  processingSteps?: Array<ProcessingStep>;
  /** The LLM model to use */
  llmModel?: string;
  /** The fallback LLM model to use for parallelization (alternates between models to avoid rate limiting) */
  fallbackModel?: string;
  /** The ID of the run */
  runId?: string;
  /** The ID of the election */
  electionId?: string;
  /** The maximum number of comments to use for a single condensation run */
  maxCommentsPerGroup?: number;
  /** For ordinal questions, invert the pro/con classification */
  invertProsAndCons?: boolean;
}

/**
 * Input parameters for the condensation process.
 */
export interface CondensationRunInput {
  /** The question these comments relate to */
  question: SupportedQuestion;
  /** Array of comments to process */
  comments: Array<VAAComment>;
  /** Options for the condensation process */
  options: CondensationOptions;
}
