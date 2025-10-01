import { BaseController } from '@openvaa/core';
import { type LLMResponse } from '@openvaa/llm';
import { calculateLLMCost } from '@openvaa/llm';
import type { ParsedLLMResponse } from '@openvaa/llm';
import type { QuestionInfoOptions, QuestionInfoResult, ResponseWithInfo } from '../types';

/**
 * Transform any LLM response into a standardized QuestionInfoResult
 */
export function transformResponse({
  llmResponse,
  question,
  options,
  startTime,
  endTime,
  success = true
}: {
  llmResponse?: ParsedLLMResponse<ResponseWithInfo>;
  question: { id: string; name: string };
  options: QuestionInfoOptions;
  startTime: Date;
  endTime: Date;
  success?: boolean;
}): QuestionInfoResult {
  // Handle error case when no valid response
  const raw = llmResponse?.raw || ({} as LLMResponse);
  const response = success ? llmResponse?.parsed : undefined;

  // Extract data directly from response properties
  const infoSections = response && 'infoSections' in response ? response.infoSections : undefined;
  const terms = response && 'terms' in response ? response.terms : undefined;

  const duration = (endTime.getTime() - startTime.getTime()) / 1000;

  return {
    runId: `run_${Date.now()}_${Math.random()}`,
    data: {
      questionId: question.id,
      questionName: question.name,
      infoSections,
      terms
    },
    metrics: {
      duration,
      nLlmCalls: 1,
      cost: raw.usage
        ? calculateLLMCost({
            provider: options.llmProvider,
            model: options.llmModel,
            usage: raw.usage,
            controller: options.controller || new BaseController()
          })
        : 0,
      tokensUsed:
        success && raw.usage
          ? {
              inputs: raw.usage.promptTokens,
              outputs: raw.usage.completionTokens,
              total: raw.usage.totalTokens
            }
          : { inputs: 0, outputs: 0, total: 0 }
    },
    success,
    metadata: {
      llmModel: success && raw.model ? raw.model : options.llmModel,
      language: options.language,
      startTime,
      endTime
    }
  };
}
