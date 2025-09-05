import { BaseController } from '@openvaa/core';
import { type LLMResponse } from '@openvaa/llm';
import { calculateLLMCost } from '@openvaa/llm';
import type { ParsedLLMResponse } from '@openvaa/llm';
import type {
  BothOperations,
  InfoSectionsOnly,
  QuestionInfoOptions,
  QuestionInfoResult,
  ResponseWithInfo,
  TermsOnly
} from '../types';

export function transformResponse(
  llmResponse: ParsedLLMResponse<ResponseWithInfo>,
  question: { id: string; name: string },
  options: QuestionInfoOptions,
  startTime: Date,
  endTime: Date
): QuestionInfoResult {
  const parsed = llmResponse.parsed;
  const raw = llmResponse.raw;
  if (isBothOperations(parsed)) {
    return transformBothResponse(parsed, raw, question, options, startTime, endTime);
  } else if (isInfoSectionsOnly(parsed)) {
    return transformInfoSectionsResponse(parsed, raw, question, options, startTime, endTime);
  } else if (isTermsOnly(parsed)) {
    return transformTermsResponse(parsed, raw, question, options, startTime, endTime);
  } else {
    throw new Error('Invalid response for question info generation');
  }
}

/**
 * Transform info sections only response
 */
export function transformInfoSectionsResponse(
  response: InfoSectionsOnly,
  raw: LLMResponse,
  question: { id: string; name: string },
  options: QuestionInfoOptions,
  startTime: Date,
  endTime: Date
): QuestionInfoResult {
  return {
    runId: generateRunId(),
    questionId: question.id,
    questionName: question.name,
    infoSections: response.infoSections,
    terms: undefined,
    metrics: {
      duration: (endTime.getTime() - startTime.getTime()) / 1000,
      nLlmCalls: 1,
      cost: calculateLLMCost({
        provider: 'openai',
        model: options.llmModel,
        usage: raw.usage,
        controller: options.controller || new BaseController()
      }),
      tokensUsed: {
        inputs: raw.usage.promptTokens,
        outputs: raw.usage.completionTokens,
        total: raw.usage.totalTokens
      }
    },
    success: true,
    metadata: {
      llmModel: raw.model || options.llmModel,
      language: options.language,
      startTime,
      endTime
    }
  };
}

/**
 * Transform terms only response
 */
export function transformTermsResponse(
  response: TermsOnly,
  raw: LLMResponse,
  question: { id: string; name: string },
  options: QuestionInfoOptions,
  startTime: Date,
  endTime: Date
): QuestionInfoResult {
  return {
    runId: generateRunId(),
    questionId: question.id,
    questionName: question.name,
    infoSections: undefined,
    terms: response.terms,
    metrics: {
      duration: (endTime.getTime() - startTime.getTime()) / 1000,
      nLlmCalls: 1,
      cost: calculateLLMCost({
        provider: 'openai',
        model: options.llmModel,
        usage: raw.usage,
        controller: options.controller || new BaseController()
      }),
      tokensUsed: {
        inputs: raw.usage.promptTokens,
        outputs: raw.usage.completionTokens,
        total: raw.usage.totalTokens
      }
    },
    success: true,
    metadata: {
      llmModel: raw.model || options.llmModel,
      language: options.language,
      startTime,
      endTime
    }
  };
}

/**
 * Transform both info sections and terms response
 */
export function transformBothResponse(
  response: BothOperations,
  raw: LLMResponse,
  question: { id: string; name: string },
  options: QuestionInfoOptions,
  startTime: Date,
  endTime: Date
): QuestionInfoResult {
  return {
    runId: generateRunId(),
    questionId: question.id,
    questionName: question.name,
    infoSections: response.infoSections,
    terms: response.terms,
    metrics: {
      duration: (endTime.getTime() - startTime.getTime()) / 1000,
      nLlmCalls: 1,
      cost: calculateLLMCost({
        provider: 'openai',
        model: options.llmModel,
        usage: raw.usage,
        controller: options.controller || new BaseController()
      }),
      tokensUsed: {
        inputs: raw.usage.promptTokens,
        outputs: raw.usage.completionTokens,
        total: raw.usage.totalTokens
      }
    },
    success: true,
    metadata: {
      llmModel: raw.model || options.llmModel,
      language: options.language,
      startTime,
      endTime
    }
  };
}

/**
 * Create error result when generation fails
 */
export function createErrorResult(
  question: { id: string; name: string },
  raw: LLMResponse,
  options: QuestionInfoOptions,
  startTime: Date,
  endTime: Date
): QuestionInfoResult {
  return {
    runId: generateRunId(),
    questionId: question.id,
    questionName: question.name,
    metrics: {
      duration: (endTime.getTime() - startTime.getTime()) / 1000,
      nLlmCalls: 1,
      cost: calculateLLMCost({
        provider: 'openai',
        model: options.llmModel,
        usage: raw.usage,
        controller: options.controller || new BaseController()
      }),
      tokensUsed: { inputs: 0, outputs: 0, total: 0 }
    },
    success: false,
    metadata: {
      llmModel: options.llmModel,
      language: options.language,
      startTime,
      endTime
    }
  };
}

/**
 * Generate a unique run ID
 */
export function generateRunId(): string {
  return `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function isInfoSectionsOnly(response: ResponseWithInfo): response is InfoSectionsOnly {
  return 'infoSections' in response && !('terms' in response);
}

function isTermsOnly(response: ResponseWithInfo): response is TermsOnly {
  return 'terms' in response && !('infoSections' in response);
}

function isBothOperations(response: ResponseWithInfo): response is BothOperations {
  return 'infoSections' in response && 'terms' in response;
}
