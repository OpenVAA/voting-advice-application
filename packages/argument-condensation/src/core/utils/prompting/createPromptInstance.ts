import { DefaultLogger } from '@openvaa/core';
import { calculateLLMCost } from '@openvaa/llm';
import type { Logger } from '@openvaa/core';
import type { LLMProvider, LLMResponse } from '@openvaa/llm';
import type { CondensationOperation, PromptCall } from '../../types';

/**
 * Helper method to create a PromptCall instance with proper latency and cost tracking
 *
 * @param operation - The operation that was performed
 * @param promptId - The ID of the prompt that was used
 * @param rawInputText - The raw input text that was sent to the LLM
 * @param llmResponse - The response from the LLM
 * @param latency - The latency of the LLM call
 * @param llmProvider - The LLM provider instance for cost calculation
 */
export function createPromptInstance({
  operation,
  promptId,
  rawInputText,
  llmResponse,
  latency,
  llmProvider,
  logger = new DefaultLogger()
}: {
  operation: CondensationOperation;
  promptId: string;
  rawInputText: string;
  llmResponse: LLMResponse;
  latency: number;
  llmProvider: LLMProvider; // Using any to avoid circular dependency with LLMProvider from @openvaa/llm
  logger?: Logger;
}): PromptCall {
  // Calculate cost for this LLM call using the actual provider
  const callCost = calculateLLMCost({
    provider: llmProvider.name,
    model: llmResponse.model,
    usage: {
      promptTokens: llmResponse.usage.promptTokens,
      completionTokens: llmResponse.usage.completionTokens,
      totalTokens: llmResponse.usage.totalTokens
    },
    logger
  });

  return {
    promptTemplateId: promptId,
    operation,
    rawInputText,
    rawOutputText: llmResponse.content,
    modelUsed: llmResponse.model,
    timestamp: new Date().toISOString(),
    metadata: {
      tokens: {
        input: llmResponse.usage.promptTokens,
        output: llmResponse.usage.completionTokens,
        total: llmResponse.usage.totalTokens
      },
      latency,
      cost: callCost
    }
  };
}
