import type { LLMObjectGenerationResult } from '@openvaa/llm-refactor';
import type { QuestionInfoData, QuestionInfoResult, ResponseWithInfo } from '../types';

/**
 * Transform any LLM response into a standardized QuestionInfoResult
 */
export function transformResponse({
  llmResponse,
  question,
  success,
  runId,
  language,
  startTime,
  endTime
}: {
  llmResponse: LLMObjectGenerationResult<ResponseWithInfo>;
  question: { id: string; name: string };
  success: boolean;
  runId: string;
  language: string;
  startTime: Date;
  endTime: Date;
}): QuestionInfoResult {
  const responseData = llmResponse.object;

  const infoSections = responseData && 'infoSections' in responseData ? responseData.infoSections : undefined;
  const terms = responseData && 'terms' in responseData ? responseData.terms : undefined;

  const questionData: QuestionInfoData = {
    questionId: question.id,
    infoSections,
    terms
  };

  return {
    runId,
    data: questionData,
    llmMetrics: {
      processingTimeMs: llmResponse.latencyMs,
      nLlmCalls: llmResponse.attempts,
      costs: llmResponse.costs,
      tokens: llmResponse.usage
    },
    success,
    metadata: {
      modelsUsed: [llmResponse.response.modelId],
      language,
      startTime,
      endTime
    }
  };
}
