import type { CommonLLMParams } from '@openvaa/llm-refactor';
import type { CondensationOutputType } from './condensationType';
import type { ProcessingStep } from './processDefinition';
import type { SupportedQuestion } from './supportedQuestion';
/**
 * Represents a single non-empty comment given by a candidate in the VAA.
 *
 * @example
 *
 * const comment: Comment = {
 *   id: '123',
 *   entityId: '456',
 *   entityAnswer: 1, // number or string
 *   text: 'This is a comment'
 * };
 */
export interface Comment {
  id: string;
  entityId: string;
  entityAnswer: number | string;
  text: string;
}

/**
 * Options for condensing a group of comments into a single argument list with a specified output type.
 * A single question usually has comments containing arguments for multiple categories
 * like why taxes should be higher (pros) or lower (cons) or why X is better than Y and Z.
 *
 * @example
 *
 * // const llmProvider = new OpenAIProvider({ apiKey: '...' });
 * const options: CondensationOptions = {
 *   llmProvider, // An instance of LLMProvider
 *   language: 'en',
 *   outputType: 'categoricalPros',
 *   processingSteps: [
 *     {
 *       operation: 'map',
 *       params: {
 *         condensationPrompt: 'Find arguments from these comments',
 *         iterationPrompt: 'Improve these arguments',
 *         batchSize: 20
 *       }
 *     },
 *     {
 *       operation: 'reduce',
 *       params: {
 *         coalescingPrompt: 'Remove overlap between these argument lists and output one coalesced list',
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
export interface CondensationOptions extends CommonLLMParams {
  /** The language of the comments. This also impacts the language of the prompts used */
  language: string;
  /** The type of output to generate. E.g. categoricalPros, booleanPros, likertPros, etc */
  outputType: CondensationOutputType;
  /** The steps to process the comments. Usually used to create a map-reduce pipeline */
  processingSteps: Array<ProcessingStep>;
  /** Whether to enable the operation tree data creation */
  createVisualizationData: boolean;
  /** The number of parallel batches to use for parallelizable operations */
  parallelBatches?: number;
}

/**
 * Input parameters for the condensation process.
 *
 * @example
 *
 * // 1. Define the question. See types/base/supportedQuestion.ts for the supported question types.
 * const question = {
 *   id: 'q2',
 *   type: 'single-choice-categorical',
 *   text: { en: 'What is the best way to improve public transport?' },
 *   choices: [
 *     { id: 'choice1', text: { en: 'Invest in new subway lines' } },
 *     { id: 'choice2', text: { en: 'Increase bus frequency' } },
 *     { id: 'choice3', text: { en: 'Introduce more bike lanes' } }
 *   ]
 * };
 *
 * // 2. Provide comments from VAA
 * const comments = [
 *   { id: 'c1', entityId: 'cand1', entityAnswer: 'choice1', text: 'New subways are essential for a growing city.' },
 *   { id: 'c2', entityId: 'cand2', entityAnswer: 'choice2', text: 'Buses are more flexible and cheaper to expand.' }
 * ];
 *
 * // 3. Configure condensation options
 * // Note that the processing steps use pre-defined prompts, so they are not given as params.
 * // If you wish to use custom prompts, see core/main.ts for the available options.
 * const llmProvider = new OpenAIProvider({ apiKey: 'i-am-not-a-real-api-key-i-think' });
 * const options = {
 *   llmProvider, // An instance of an LLMProvider
 *   language: 'en',
 *   outputType: 'categoricalPros',
 *   processingSteps: [
 *     {
 *       operation: 'map',
 *       params: {
 *         batchSize: 20
 *       }
 *     },
 *     {
 *       operation: 'reduce',
 *       params: {
 *         denominator: 5
 *       }
 *     }
 *   ],
 *   llmModel: 'gpt-4o',
 *   runId: 'run-456'
 * };
 *
 * // 4. Combine into condensation input
 * const input: CondensationRunInput = {
 *   question, // as SupportedQuestion
 *   comments,
 *   options
 * };
 */
export interface CondensationRunInput {
  /** The question these comments relate to */
  question: SupportedQuestion;
  /** Array of comments to process */
  comments: Array<Comment>;
  /** Options for the condensation process, e.g. the LLM model, the output type, the processing steps, etc */
  options: CondensationOptions;
}
