import { LLMResponse } from '@openvaa/llm';
import { CondensationOperation, PromptCall } from '../../types';
import { calculateLLMCost } from '../metadata/costCalculator';

  /**
   * Helper method to create a PromptCall instance with proper latency and cost tracking
   */
  export function createPromptInstance({
    operation,
    promptId,
    rawInputText,
    llmResponse,
    latency
  }: {
    operation: CondensationOperation,
    promptId: string,
    rawInputText: string,
    llmResponse: LLMResponse,
    latency: number
  }): PromptCall {
    // Calculate cost for this LLM call
    const callCost = calculateLLMCost({
      provider: 'openai', // TODO: get actual provider from llmProvider
      model: llmResponse.model,
      usage: {
        promptTokens: llmResponse.usage.promptTokens,
        completionTokens: llmResponse.usage.completionTokens,
        totalTokens: llmResponse.usage.totalTokens
      }
    });

    // Add to total cost
    this.totalCost += callCost;

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