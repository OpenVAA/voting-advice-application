import { LLMProvider } from '@openvaa/llm';
import { CondensationOutputType } from './condensationType';
import { ProcessingStep } from './processDefinition';
import { SupportedQuestion } from '../base/supportedQuestion';
/**
 * Represents a single non-empty comment given by a candidate in the VAA.
 * 
 * @example
 * 
 * const comment: VAAComment = {
 *   id: '123',
 *   candidateID: '456',
 *   candidateAnswer: 1, // number or string
 *   text: 'This is a comment'
 * };
 */
export interface VAAComment {
  id: string;
  candidateID: string;
  candidateAnswer: number | string;
  text: string;
}

/**
 * Options for condensing a group of comments into a single argument list with a specified output type.
 * A single question usually has comments containing arguments for multiple categories
 * like why taxes should be higher (pros) or lower (cons) or why X is better than Y and Z. 
 * 
 * @example
 * 
 * const options: CondensationOptions = {
 *   llmProvider: OpenAIProvider,
 *   language: 'en',
 *   outputType: 'categoricalPros',
 *   processingSteps: [
 *     {
 *       operation: CondensationOperation.MAP,
 *       params: {
 *         condensationPrompt: 'Condense there comments into a single argument list',
 *         iterationPrompt: 'Improve the argument list with these comments',
 *         batchSize: 42
 *       }
 *     },
 *     {
 *       operation: CondensationOperation.REDUCE,
 *       params: {
 *         coalescingPrompt: 'Coalesce these argument lists into a single argument list',
 *         denominator: 5
 *       }
 *     }
 *   ],
 *   llmModel: 'gpt-4o',
 *   fallbackModel: 'gpt-4o-mini', // Optional. Used for LLM calls when main model is temporarily rate limited
 *   runId: '123',
 *   electionId: '456'
 *   maxCommentsPerGroup: 100,
 *   invertProsAndCons: false // If likert scale is inverted
 * };
 */
export interface CondensationOptions {
  /** The LLM provider to use, e.g. OpenAIProvider. See LLM package for more details */
  llmProvider: LLMProvider;
  /** The language of the comments. This also impacts the language of the prompts used */
  language: string;
  /** The type of output to generate. E.g. categoricalPros, booleanPros, likertPros, etc */
  outputType: CondensationOutputType;
  /** The steps to process the comments. Usually used to create a map-reduce pipeline */
  processingSteps: Array<ProcessingStep>;
  /** The LLM model to use. We use a default model if this is not provided */
  llmModel?: string;
  /** The fallback LLM model to use for parallelization (alternates between models to avoid rate limiting) */
  fallbackModel?: string;
  runId?: string;
  electionId?: string;
  /** A question can have multiple groups of comments. This is the maximum number of comments per group */
  maxCommentsPerGroup?: number;
  /** For ordinal questions, optionallyinvert the pro/con classification */
  invertProsAndCons?: boolean;
}

/**
 * Input parameters for the condensation process.
 * 
 * @example
 * 
 * const input: CondensationRunInput = {
 *   question,
 *   comments,
 *   options
 * };
 */
export interface CondensationRunInput {
  /** The question these comments relate to */
  question: SupportedQuestion;
  /** Array of comments to process */
  comments: Array<VAAComment>;
  /** Options for the condensation process, e.g. the LLM model, the output type, the processing steps, etc */
  options: CondensationOptions;
}
