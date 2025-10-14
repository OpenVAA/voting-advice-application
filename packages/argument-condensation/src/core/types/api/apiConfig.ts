import type { CommonLLMParams } from '@openvaa/llm-refactor';
import type { CondensationOutputType } from '../condensation/condensationType';

/**
 * Prompt IDs for different condensation types and operations.
 * The keys of the inner object are roles for prompts within an operation,
 * e.g., 'map' and 'mapIteration' for the 'map' operation.
 */
export type PromptConfig = {
  [key in CondensationOutputType]?: {
    map?: string;
    mapIteration?: string;
    reduce?: string;
    // Future operations like 'refine' or 'ground' can be added here.
  };
};

/**
 * Configuration options for the condensation API.
 *
 * @example
 * const apiConfig: CondensationAPIOptions = {
 *   llmProvider: new OpenAIProvider({ apiKey: 'your-api-key' }),
 *   llmModel: 'gpt-4o',
 *   language: 'en',
 *   runId: '123',
 *   parallelBatches: 3,
 *   modelTPMLimit: 30000,
 *   createVisualizationData: true
 * };
 * .
 */
export type CondensationAPIOptions = CommonLLMParams & {
  language: string;
  maxCommentsPerGroup: number;
  createVisualizationData?: boolean;
  invertProsAndCons?: boolean;
  prompts?: PromptConfig;
};
