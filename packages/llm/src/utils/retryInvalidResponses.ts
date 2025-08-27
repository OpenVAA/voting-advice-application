import { parseAndValidate } from './llmParsing';
import type { LLMProvider } from '../llm-providers/llm-provider';
import type { LLMResponse, Message } from '../types';
import type { LLMResponseContract } from './llmParsing';

/**
 * Retry helper function for failed parsing attempts
 * @param failedIndices - Array of indices that failed in the batch
 * @param llmInputs - Original LLM inputs
 * @param maxRetries - Maximum number of retry attempts
 * @returns Array of successful LLM responses
 */

export async function retryInvalidResponses<TType>(
  failedIndices: Array<number>,
  llmInputs: Array<{
    messages: Array<Message>;
    temperature: number;
    maxTokens?: number;
  }>,
  maxRetries: number = 2,
  responseContract: LLMResponseContract<TType>,
  provider: LLMProvider,
  model?: string
): Promise<Array<{ index: number; response: LLMResponse }>> {
  const successfulRetries: Array<{ index: number; response: LLMResponse }> = [];

  // Process all failed indices in parallel
  const retryPromises = failedIndices.map(async (failedIndex) => {
    const input = llmInputs[failedIndex];

    // Try to generate a response for the failed index
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const response = await provider.generate({
        ...input,
        ...(model && { model })
      });

      // Try to parse the response to make sure it's valid
      parseAndValidate(response.content, responseContract);

      return { index: failedIndex, response };
    }

    // If we get here, all retry attempts failed, return null for the failed index
    return null;
  });

  // Wait for all retry attempts to complete
  const retryResults = await Promise.all(retryPromises);

  // Filter out null results (failed retries) and collect successful ones
  for (const result of retryResults) {
    if (result !== null) {
      successfulRetries.push(result);
    }
  }

  return successfulRetries;
}
