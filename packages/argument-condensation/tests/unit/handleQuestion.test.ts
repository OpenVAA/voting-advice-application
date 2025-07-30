import { BooleanQuestion, DataRoot, QUESTION_TYPE } from '@openvaa/data';
import { LLMProvider, LLMResponse } from '@openvaa/llm';
import { describe, expect, it } from 'vitest';
import { SUPPORTED_LANGUAGES } from '../../src';
import { handleQuestion } from '../../src/main';
import type { HasAnswers } from '@openvaa/core';

// Mock LLMProvider
class MockLLMProvider extends LLMProvider {
  constructor() {
    super();
  }
  generate(): Promise<LLMResponse> {
    throw new Error('Method not implemented.');
  }
  generateWithRetry(): Promise<LLMResponse> {
    throw new Error('Method not implemented.');
  }
  generateMultipleParallel(): Promise<Array<LLMResponse>> {
    throw new Error('Method not implemented.');
  }
  generateMultipleSequential(): Promise<Array<LLMResponse>> {
    throw new Error('Method not implemented.');
  }
}

describe('handleQuestion', () => {
  it('should throw an error for an unsupported language', async () => {
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
        llmProvider,
        language: unsupportedLanguage
      })
    ).rejects.toThrow(
      `Unsupported language: ${unsupportedLanguage}. Please use a supported language: ${SUPPORTED_LANGUAGES.join(', ')}`
    );
  });
});
