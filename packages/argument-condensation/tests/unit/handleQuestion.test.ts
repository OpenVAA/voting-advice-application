import { BooleanQuestion, QUESTION_TYPE } from '@openvaa/data';
import { LLMProvider } from '@openvaa/llm';
import { describe, expect, test } from 'vitest';
import { SUPPORTED_LANGUAGES } from '../../src';
import { handleQuestion } from '../../src/api';
import type { Controller, HasAnswers } from '@openvaa/core';
import type { DataRoot } from '@openvaa/data';
import type { LLMResponse, ParsedLLMResponse } from '@openvaa/llm';

// No-op controller for tests to prevent logging output
const noOpLogger: Controller = {
  info: () => {},
  warning: () => {},
  error: () => {},
  progress: () => {},
  checkAbort: () => {},
  defineSubOperations: () => {},
  getCurrentOperation: () => null
};

// Mock LLMProvider
class MockLLMProvider extends LLMProvider {
  readonly name = 'mock';

  constructor() {
    super();
  }
  generate(): Promise<LLMResponse> {
    throw new Error('Method not implemented.');
  }
  generateWithRetry(): Promise<LLMResponse> {
    throw new Error('Method not implemented.');
  }
  generateAndValidateWithRetry<TType>(): Promise<ParsedLLMResponse<TType>> {
    throw new Error('Method not implemented.');
  }
  // @ts-expect-error - the overload method generateMultipleParallel returns an array of ParsedLLMResponses
  // instead of an array of LLMResponses, when it is used inside the condenser
  generateMultipleParallel<TType>(): Promise<Array<ParsedLLMResponse<TType>>> {
    throw new Error('Method not implemented.');
  }
  generateMultipleSequential(): Promise<Array<LLMResponse>> {
    throw new Error('Method not implemented.');
  }
}

describe('handleQuestion', () => {
  test('It should throw an error for an unsupported language', async () => {
    const unsupportedLanguage = 'lol';
    const question = new BooleanQuestion({
      data: {
        id: 'q1',
        type: QUESTION_TYPE.Boolean,
        name: 'Test question',
        customData: {},
        categoryId: 'cat1'
      },
      root: {
        checkId: () => true,
        data: {
          questions: {
            text: {
              q1: {
                en: 'Test question'
              }
            }
          }
        }
      } as unknown as DataRoot
    });
    const entities: Array<HasAnswers> = [];
    const llmProvider = new MockLLMProvider();

    await expect(
      handleQuestion({
        question,
        entities,
        options: {
          language: unsupportedLanguage,
          // @ts-expect-error - the overload method generateMultipleParallel used inside the condenser
          // returns an array of ParsedLLMResponses, but the line below complains about a type mismatch
          llmProvider,
          llmModel: 'gpt-4o',
          runId: 'test-run',
          maxCommentsPerGroup: 1000,
          controller: noOpLogger
        }
      })
    ).rejects.toThrow(
      `Unsupported language: ${unsupportedLanguage}. Please use a supported language: ${SUPPORTED_LANGUAGES.join(', ')}`
    );
  });
});
