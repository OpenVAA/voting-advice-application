import type { CommonLLMParams } from '@openvaa/llm';
import type { CondensationOutputType } from './condensationType';
import type { ProcessingStep } from './processDefinition';
import type { SupportedQuestion } from './supportedQuestion';
/**
 * Represents a single non-empty comment given by a candidate in the VAA.
 *
 * @example
 * ```ts
 * const comment: Comment = {
 *   id: '123',
 *   entityId: '456',
 *   entityAnswer: 1, // number or string
 *   text: 'This is a comment'
 * };
 * ```
 */
export interface Comment {
  id: string;
  entityId: string;
  entityAnswer: number | string;
  text: string;
}

/**
 * Options for condensing a group of comments into a single argument list with a specified output type.
 * A single question usually has comments containing arguments for multiple categories like why taxes should be higher (pros) or lower (cons) or why X is better than Y and Z.
 *
 * @example
 * ```ts
 * const options: CondensationOptions = {
 *   llmProvider, // An LLMProvider instance
 *   language: 'en',
 *   runId: '123',
 *   outputType: 'categoricalPros',
 *   processingSteps: [
 *     {
 *       operation: 'MAP',
 *       params: { condensationPromptId: 'map_categoricalPros_condensation_v1', batchSize: 20 }
 *     },
 *     {
 *       operation: 'REDUCE',
 *       params: { coalescingPromptId: 'reduce_categoricalPros_coalescing_v1', denominator: 5 }
 *     }
 *   ],
 *   createVisualizationData: false,
 *   parallelBatches: 3 // Optional
 * };
 * ```
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
 * ```ts
 * // 1. Define the question. See `SupportedQuestion` for the supported question types.
 * const question = new SingleChoiceCategoricalQuestion({
 *   data: {
 *     id: 'q2',
 *     type: QUESTION_TYPE.SingleChoiceCategorical,
 *     name: 'What is the best way to improve public transport?',
 *     categoryId: 'cat1',
 *     choices: [
 *       { id: 'choice1', label: 'Invest in new subway lines' },
 *       { id: 'choice2', label: 'Increase bus frequency' },
 *       { id: 'choice3', label: 'Introduce more bike lanes' }
 *     ]
 *   },
 *   root: dataRoot // Your DataRoot instance
 * });
 *
 * // 2. Provide the comments from the VAA.
 * const comments = [
 *   { id: 'c1', entityId: 'cand1', entityAnswer: 'choice1', text: 'New subways are essential for a growing city.' },
 *   { id: 'c2', entityId: 'cand2', entityAnswer: 'choice2', text: 'Buses are more flexible and cheaper to expand.' }
 * ];
 *
 * // 3. Configure the condensation options. Each processing step names its prompt by id.
 * const llmProvider = new LLMProvider({
 *   provider: 'openai',
 *   apiKey: 'i-am-not-a-real-api-key-i-think',
 *   modelConfig: { primary: 'gpt-4o' }
 * });
 * const options: CondensationOptions = {
 *   llmProvider,
 *   language: 'en',
 *   runId: 'run-456',
 *   outputType: 'categoricalPros',
 *   processingSteps: [
 *     { operation: 'MAP', params: { condensationPromptId: 'map_categoricalPros_condensation_v1', batchSize: 20 } },
 *     { operation: 'REDUCE', params: { coalescingPromptId: 'reduce_categoricalPros_coalescing_v1', denominator: 5 } }
 *   ],
 *   createVisualizationData: false
 * };
 *
 * // 4. Combine them into the condensation input.
 * const input: CondensationRunInput = {
 *   question,
 *   comments,
 *   options
 * };
 * ```
 */
export interface CondensationRunInput {
  /** The question these comments relate to */
  question: SupportedQuestion;
  /** Array of comments to process */
  comments: Array<Comment>;
  /** Options for the condensation process, e.g. the LLM model, the output type, the processing steps, etc */
  options: CondensationOptions;
}
