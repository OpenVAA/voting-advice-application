import type { TokenUsage } from './tokenUsage';

export interface LLMResponse {
  content: string;
  usage: TokenUsage;
  model: string;
  finishReason?: string;
}

/**
 * A response from the LLM that has been parsed into a specific type inside the LLM package,
 * making it possible to use the response object in the rest of the application without having to
 * parse the response again.
 *
 * @example
 * const readyToUseResponse: ParsedLLMResponse<ObjectWeWantFromLLM> = await llmProvider.generateAndValidateWithRetry({
 *   messages: [{ role: 'user', content: 'Respond with JSON with fields "name" and "age"' }],
 *   temperature: 0.7,
 *   maxTokens: 100,
 *   responseContract: {
 *     validate: (obj: unknown) => obj is ObjectWeWantFromLLM
 *   }
 * });
 *
 * const parsedResponse = readyToUseResponse.parsed;
 * console.log(parsedResponse) // { name: 'John', age: 30 }
 *
 */
export interface ParsedLLMResponse<TType> {
  parsed: TType;
  raw: LLMResponse;
}
