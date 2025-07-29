import { VAAComment } from '../../types';
import { setPromptVars } from '..';

/**
 * Validates that the token count for batches of comments does not exceed the maximum allowed limit.
 * This is a pre-processing step to prevent API failures with large inputs, especially for the MAP operation.
 * It estimates token count based on character count and checks batches that are processed in parallel.
 *
 * @param batches - The batches of comments to validate
 * @param topic - The topic of the comments (although quite irrelevant for token count estimation)
 * @param condensationPrompt - The prompt template to use for condensation
 * @param parallelFactor - The number of batches to process in parallel
 * @returns An object indicating whether the validation was successful. If not, it includes the index
 * of the failed batch group and its estimated token count.
 */
export function validateInputTokenCount({
  batches,
  topic,
  condensationPrompt,
  parallelFactor,
  modelTPMLimit
}: {
  batches: Array<Array<VAAComment>>;
  topic: string;
  condensationPrompt: string;
  parallelFactor: number;
  modelTPMLimit: number;
}): {
  success: boolean;
  failedBatchIndex?: number;
  tokenCount?: number;
} {
  // Estimate token usage by creating sample prompts
  const llmInputsForTokenCheck = batches.map((batch) => {
    const templateVariables: Record<string, unknown> = {
      topic: topic,
      comments: batch.map((c) => c.text).join('\n')
    };
    const promptText = setPromptVars({ promptText: condensationPrompt, variables: templateVariables });
    return { messages: [{ role: 'system' as const, content: promptText }] };
  });

  // Rough token estimation: characters / 4 * safety margin
  const promptCharsCounts = llmInputsForTokenCheck.map((input) =>
    input.messages.reduce((total, message) => total + message.content.length, 0)
  );

  // Check consecutive batches that would be sent together
  for (let i = 0; i < promptCharsCounts.length; i += parallelFactor) {
    const batchEnd = Math.min(i + parallelFactor, promptCharsCounts.length);
    const batchCharSum = promptCharsCounts.slice(i, batchEnd).reduce((sum, count) => sum + count, 0);
    const estimatedTokens = (batchCharSum / 4) * 1.3; // Simple token estimation with buffer

    if (estimatedTokens > modelTPMLimit) {
      return {
        success: false,
        failedBatchIndex: Math.floor(i / parallelFactor),
        tokenCount: estimatedTokens
      };
    }
  }

  return { success: true };
}
