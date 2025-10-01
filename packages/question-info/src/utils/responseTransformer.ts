import type { LLMObjectGenerationResult } from '@openvaa/llm-refactor';
import type { QuestionInfoData, QuestionInfoResult, ResponseWithInfo } from '../types';

/**
 * Transform any LLM response into a standardized QuestionInfoResult
 */
export function transformResponse({
  llmResponse,
  question,
  success
}: {
  llmResponse: LLMObjectGenerationResult<ResponseWithInfo>;
  question: { id: string; name: string };
  success: boolean;
}): QuestionInfoResult {
  const responseData = llmResponse.object;

  const infoSections = responseData && 'infoSections' in responseData ? responseData.infoSections : undefined;
  const terms = responseData && 'terms' in responseData ? responseData.terms : undefined;

  const questionData: QuestionInfoData = {
    questionId: question.id,
    questionName: question.name,
    infoSections,
    terms
  };

  return {
    ...llmResponse,
    object: questionData,
    success
  };
}
