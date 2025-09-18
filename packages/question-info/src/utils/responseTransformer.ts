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

/** A helper function to transform the LLM's response into our result format.
 *
 * Basically just a switch statement that calls the appropriate concrete function based on the response type.
 *
 * @param params - Parameters object
 * @param params.llmResponse - The parsed LLM response
 * @param params.question - Question metadata
 * @param params.options - Generation options
 * @param params.startTime - Generation start time
 * @param params.endTime - Generation end time
 * @returns Formatted question info result
 *
 * @example
 * ```ts
 * const llmResponse = await llm.generate({
 *   prompt: 'What is the capital of France?',
 *   responseContract: responseValContract
 * });
 *
 * const question = { id: '1', name: 'What is the capital of France?' };
 * const options = {
 *   llmModel: 'gpt-4o',
 *   llmProvider: new OpenAIProvider(),
 *   language: 'en',
 *   controller: new BaseController()
 *   // And so on. See type QuestionInfoOptions for all options
 * };
 * const startTime = new Date();
 * const endTime = new Date();
 *
 * const result = transformResponse({ llmResponse, question, options, startTime, endTime });
 * ```
 */
export function transformResponse({
  llmResponse,
  question,
  options,
  startTime,
  endTime
}: {
  llmResponse: ParsedLLMResponse<ResponseWithInfo>;
  question: { id: string; name: string };
  options: QuestionInfoOptions;
  startTime: Date;
  endTime: Date;
}): QuestionInfoResult {
  const parsed = llmResponse.parsed;
  const raw = llmResponse.raw;
  if (isBothOperations(parsed)) {
    return transformBothResponse({ response: parsed, raw, question, options, startTime, endTime });
  } else if (isInfoSectionsOnly(parsed)) {
    return transformInfoSectionsResponse({ response: parsed, raw, question, options, startTime, endTime });
  } else if (isTermsOnly(parsed)) {
    return transformTermsResponse({ response: parsed, raw, question, options, startTime, endTime });
  } else {
    throw new Error('Invalid response for question info generation');
  }
}

export function transformInfoSectionsResponse({
  response,
  raw,
  question,
  options,
  startTime,
  endTime
}: {
  response: InfoSectionsOnly;
  raw: LLMResponse;
  question: { id: string; name: string };
  options: QuestionInfoOptions;
  startTime: Date;
  endTime: Date;
}): QuestionInfoResult {
  return {
    runId: generateRunId(),
    data: {
      questionId: question.id,
      questionName: question.name,
      infoSections: response.infoSections,
      terms: undefined
    },
    metrics: {
      duration: (endTime.getTime() - startTime.getTime()) / 1000,
      nLlmCalls: 1,
      cost: calculateLLMCost({
        provider: options.llmProvider,
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

export function transformTermsResponse({
  response,
  raw,
  question,
  options,
  startTime,
  endTime
}: {
  response: TermsOnly;
  raw: LLMResponse;
  question: { id: string; name: string };
  options: QuestionInfoOptions;
  startTime: Date;
  endTime: Date;
}): QuestionInfoResult {
  return {
    runId: generateRunId(),
    data: {
      questionId: question.id,
      questionName: question.name,
      infoSections: undefined,
      terms: response.terms
    },
    metrics: {
      duration: (endTime.getTime() - startTime.getTime()) / 1000,
      nLlmCalls: 1,
      cost: calculateLLMCost({
        provider: options.llmProvider,
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

export function transformBothResponse({
  response,
  raw,
  question,
  options,
  startTime,
  endTime
}: {
  response: BothOperations;
  raw: LLMResponse;
  question: { id: string; name: string };
  options: QuestionInfoOptions;
  startTime: Date;
  endTime: Date;
}): QuestionInfoResult {
  return {
    runId: generateRunId(),
    data: {
      questionId: question.id,
      questionName: question.name,
      infoSections: response.infoSections,
      terms: response.terms
    },
    metrics: {
      duration: (endTime.getTime() - startTime.getTime()) / 1000,
      nLlmCalls: 1,
      cost: calculateLLMCost({
        provider: options.llmProvider,
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

// ... existing code ...

/**
 * Create error result when generation fails
 *
 * @param params - Parameters object
 * @param params.question - Question metadata
 * @param params.raw - Raw LLM response
 * @param params.options - Generation options
 * @param params.startTime - Generation start time
 * @param params.endTime - Generation end time
 * @returns Error result with failure metadata
 */
export function createErrorResult({
  question,
  raw,
  options,
  startTime,
  endTime
}: {
  question: { id: string; name: string };
  raw: LLMResponse;
  options: QuestionInfoOptions;
  startTime: Date;
  endTime: Date;
}): QuestionInfoResult {
  return {
    runId: generateRunId(),
    data: {
      questionId: question.id,
      questionName: question.name,
      infoSections: undefined,
      terms: undefined
    },
    metrics: {
      duration: (endTime.getTime() - startTime.getTime()) / 1000,
      nLlmCalls: 1,
      cost: calculateLLMCost({
        provider: options.llmProvider,
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
 * Generate a unique run ID for tracking generation runs
 *
 * @returns Unique identifier string with timestamp and random suffix
 *
 * @example
 * ```ts
 * const runId = generateRunId();
 * console.log(runId); // 'run_1699123456789_abc123def'
 * ```
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
