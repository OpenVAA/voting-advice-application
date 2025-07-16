import { LLMProvider, Message } from '../llm-providers/llm-provider';
import { LLMResponse } from '../llm-providers/llm-provider';
import { LlmParser, LLMResponseContract } from '../utils/llmParser';

/**
 * Retry helper function for failed parsing attempts
 * @param failedIndices Array of indices that failed in the batch
 * @param llmInputs Original LLM inputs
 * @param operation Operation name for logging
 * @param maxRetries Maximum number of retry attempts
 * @returns Array of successful LLM responses
 */

export async function retryFailedCalls<TType>(
  failedIndices: Array<number>,
  llmInputs: Array<{
    messages: Array<Message>;
    temperature: number;
    maxTokens?: number;
  }>,
  operation: string,
  maxRetries: number = 2,
  responseContract: LLMResponseContract<TType>,
  provider: LLMProvider
): Promise<Array<{ index: number; response: LLMResponse }>> {
  const successfulRetries: Array<{ index: number; response: LLMResponse }> = [];

  // Process all failed indices in parallel
  const retryPromises = failedIndices.map(async (failedIndex) => {
    const input = llmInputs[failedIndex];
    let lastError: Error | null = null;

    console.info(`\n⚠️  Retrying ${operation} for batch ${failedIndex + 1} (up to ${maxRetries} attempts)`);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.info(`   Attempt ${attempt}/${maxRetries}...`);
        const response = await provider.generate(input);

        // Try to parse the response to make sure it's valid
        LlmParser.parse(response.content, responseContract);

        console.info(`   ✅ Success on attempt ${attempt}`);
        return { index: failedIndex, response };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.info(`   ❌ Attempt ${attempt} failed: ${lastError.message}`);

        if (attempt === maxRetries) {
          console.info(`   🚫 All ${maxRetries} retry attempts failed for batch ${failedIndex + 1}`);
        }
      }
    }

    // If we get here, all retry attempts failed
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