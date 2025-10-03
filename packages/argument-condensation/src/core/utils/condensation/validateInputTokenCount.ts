import { BaseController } from '@openvaa/core';
import { setPromptVars } from '@openvaa/llm-refactor';
import { COMMENT_PROCESSING } from '../../../defaultValues';
import type { Controller } from '@openvaa/core';
import type { VAAComment } from '../../types';

/**
 * Validates that the token count for batches of comments does not exceed the maximum allowed limit.
 * This is a pre-processing step to prevent API failures with large inputs, especially for the map operation.
 * It estimates token count based on character count and checks batches that are processed in parallel.
 *
 * @param batches - The batches of comments to validate
 * @param topic - The topic of the comments (although quite irrelevant for token count estimation)
 * @param condensationPrompt - The prompt template to use for condensation
 * @param parallelFactor - The number of batches to process in parallel
 * @param modelTPMLimit - The maximum number of tokens the model can handle per minute
 * @returns An object indicating whether the validation was successful. If not, it includes the index
 * of the failed batch group and its estimated token count.
 */
export function validateInputTokenCount({
  batches,
  topic,
  condensationPrompt,
  parallelFactor,
  modelTPMLimit,
  controller = new BaseController()
}: {
  batches: Array<Array<VAAComment>>;
  topic: string;
  condensationPrompt: string;
  parallelFactor: number;
  modelTPMLimit: number;
  controller?: Controller;
}): {
  success: boolean;
  failedBatchIndex?: number;
  tokenCount?: number;
} {
  // Estimate token usage by creating sample prompts
  const llmInputsForTokenCheck = batches.map((batch) => {
    const templateVariables = {
      topic: topic,
      comments: batch.map((c) => c.text).join('\n')
    };
    const promptText = setPromptVars({ promptText: condensationPrompt, variables: templateVariables, controller });
    return { messages: [{ role: 'system' as const, content: promptText }] };
  });

  // Rough token estimation: characters / CHAR_TO_TOKEN_RATIO * safety margin
  const promptCharsCounts = llmInputsForTokenCheck.map((input) =>
    input.messages.reduce((total, message) => total + message.content.length, 0)
  );

  // Check consecutive batches that would be sent together
  for (let i = 0; i < promptCharsCounts.length; i += parallelFactor) {
    const batchEnd = Math.min(i + parallelFactor, promptCharsCounts.length);
    const batchCharSum = promptCharsCounts.slice(i, batchEnd).reduce((sum, count) => sum + count, 0);
    const estimatedTokens =
      (batchCharSum / COMMENT_PROCESSING.CHAR_TO_TOKEN_RATIO) * COMMENT_PROCESSING.TOKEN_ESTIMATION_BUFFER;

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
