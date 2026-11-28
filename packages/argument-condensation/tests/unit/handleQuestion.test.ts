import { noOpController } from '@openvaa/core';
import { BooleanQuestion, QUESTION_TYPE } from '@openvaa/data';
import { describe, expect, test } from 'vitest';
import { handleQuestion } from '../../src/api';
import type { HasAnswers } from '@openvaa/core';
import type { Answer, DataRoot } from '@openvaa/data';
import type { LLMProvider } from '@openvaa/llm';

// Mock LLMProvider for new API
const mockLLMProvider = {
  config: {
    provider: 'openai' as const,
    apiKey: 'test-api-key',
    modelConfig: {
      primary: 'gpt-4o',
      tpmLimit: 30000
    }
  },
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
    // Non-empty, so the language check is not the only path the call can take.
    const entities: Array<HasAnswers> = [
      {
        answers: {
          q1: {
            value: true,
            info: 'Because it protects municipal services.'
          } as Answer
        }
      },
      {
        answers: {
          q1: {
            value: false,
            info: 'Because the cost outweighs the benefit.'
          } as Answer
        }
      }
    ];

    // Exact prefix: handleQuestion has several throw sites.
    await expect(
      handleQuestion({
        question,
        entities,
        options: {
          language: unsupportedLanguage,
          llmProvider: mockLLMProvider,
          runId: 'test-run',
          maxCommentsPerGroup: 1000,
          controller: noOpController
        }
      })
    ).rejects.toThrow('Unsupported language: lol');
  });
});
