import { BooleanQuestion, QUESTION_TYPE } from '@openvaa/data';
import { describe, expect, test } from 'vitest';
import { SUPPORTED_LANGUAGES } from '../../src';
import { handleQuestion } from '../../src/api';
import type { Controller, HasAnswers } from '@openvaa/core';
import type { DataRoot } from '@openvaa/data';
import type { LLMProvider } from '@openvaa/llm-refactor';

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

// Mock LLMProvider for new API
const mockLLMProvider = {
  generateObject: () => {
    throw new Error('Method not implemented.');
  },
  generateObjectParallel: () => {
    throw new Error('Method not implemented.');
  },
  streamText: () => {
    throw new Error('Method not implemented.');
  }
} as unknown as LLMProvider;

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

    await expect(
      handleQuestion({
        question,
        entities,
        options: {
          language: unsupportedLanguage,
          llmProvider: mockLLMProvider,
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
