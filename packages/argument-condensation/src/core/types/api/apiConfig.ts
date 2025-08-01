import { LLMProvider } from '@openvaa/llm';

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
 * 
 * @remarks
 * 
 * Same as the CondensationOptions type in the CondensationRunInput type, but without the question and comments.
 */
export type CondensationAPIOptions = {
  runId: string;
  llmProvider: LLMProvider;
  llmModel: string;
  language: string;
  maxCommentsPerGroup: number;
  createVisualizationData?: boolean;
  invertProsAndCons?: boolean;
  modelTPMLimit?: number;
};