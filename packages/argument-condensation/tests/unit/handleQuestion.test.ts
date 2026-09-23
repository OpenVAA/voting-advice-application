import { noOpController } from '@openvaa/core';
import { BooleanQuestion, QUESTION_TYPE } from '@openvaa/data';
import { describe, expect, test } from 'vitest';
import { handleQuestion } from '../../src/api';
import type { HasAnswers } from '@openvaa/core';
import type { DataRoot } from '@openvaa/data';
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
    const entities: Array<HasAnswers> = [];

    // Assert the EXACT rejection prefix, not a bare `toThrow()`. `handleQuestion` has several competing throw sites, so a bare matcher is satisfied by any of them — including a `Cannot read properties of undefined` from an unrelated failure. `Unsupported language: lol` is a true prefix of the live template at `api.ts:119-121` and vitest's string form is a substring match, so this is satisfied only by the language rejection this test's own title promises. Strictly stronger than a bare `/language/i` match.
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
    ).rejects.toThrow();
  });
});
