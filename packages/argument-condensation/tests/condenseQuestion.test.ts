import { type Answer, DataRoot, QUESTION_TYPE, SingleChoiceOrdinalQuestion } from '@openvaa/data';
import { describe, expect, it, vi } from 'vitest';
import { condenseQuestion } from '../new_src/api/condenseQuestion';
import { CONDENSATION_TYPE } from '../new_src/core/types';
import type { HasAnswers } from '@openvaa/core';
import type { LLMProvider } from '@openvaa/llm';

// Mock LLM Provider
const mockLLMProvider: LLMProvider = {
  generate: vi.fn().mockResolvedValue({
    content:
      '{"arguments": [{"id": "arg1", "text": "Test argument 1"}, {"id": "arg2", "text": "Test argument 2"}], "reasoning": "Test reasoning for arguments"}',
    model: 'gpt-4o-mini',
    usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 }
  }),
  generateMultipleParallel: vi.fn().mockImplementation(({ inputs }) => {
    const mockResponse = {
      content:
        '{"arguments": [{"id": "arg1", "text": "Test argument 1"}, {"id": "arg2", "text": "Test argument 2"}], "reasoning": "Test reasoning for arguments"}',
      model: 'gpt-4o-mini',
      usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 }
    };
    return Promise.resolve(Array(inputs.length).fill(mockResponse));
  }),
  generateMultipleSequential: vi.fn().mockResolvedValue([]),
  countTokens: vi.fn().mockResolvedValue({ tokens: 100 })
};

describe('condenseQuestion', () => {
  it('should condense arguments for a likert question', async () => {
    // Create a 5-point likert question
    const question = new SingleChoiceOrdinalQuestion({
      data: {
        id: 'test-question',
        type: QUESTION_TYPE.SingleChoiceOrdinal,
        name: 'Test likert question',
        categoryId: 'test-category',
        choices: [
          { id: '1', label: 'Strongly disagree', normalizableValue: 1 },
          { id: '2', label: 'Disagree', normalizableValue: 2 },
          { id: '3', label: 'Neutral', normalizableValue: 3 },
          { id: '4', label: 'Agree', normalizableValue: 4 },
          { id: '5', label: 'Strongly agree', normalizableValue: 5 }
        ]
      },
      root: new DataRoot()
    });

    // Create entities with answers that have info text
    const entities: Array<HasAnswers> = [
      {
        answers: {
          'test-question': {
            value: '5',
            info: 'I strongly agree because this is very important.'
          } as Answer
        }
      },
      {
        answers: {
          'test-question': {
            value: '1',
            info: 'I completely disagree with this statement.'
          } as Answer
        }
      }
    ];

    // Run condensation
    const results = await condenseQuestion(question, entities, {
      llmProvider: mockLLMProvider,
      language: 'en',
      outputType: CONDENSATION_TYPE.LIKERT.PROS
    });

    // Verify results
    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);

    // Each result should be a CondensationRunResult
    results.forEach((result) => {
      expect(result.runId).toBeDefined();
      expect(result.arguments).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.condensationType).toBeDefined();
    });
  });

  it('should throw error when no valid comments found', async () => {
    const question = new SingleChoiceOrdinalQuestion({
      data: {
        id: 'test-question',
        type: QUESTION_TYPE.SingleChoiceOrdinal,
        name: 'Test question',
        categoryId: 'test-category',
        choices: [
          { id: '1', label: 'Option 1', normalizableValue: 1 },
          { id: '2', label: 'Option 2', normalizableValue: 2 }
        ]
      },
      root: new DataRoot()
    });

    // Entities without info text
    const entities: Array<HasAnswers> = [
      {
        answers: {
          'test-question': {
            value: '1'
            // No info text
          } as Answer
        }
      }
    ];

    await expect(
      condenseQuestion(question, entities, {
        llmProvider: mockLLMProvider,
        language: 'en',
        outputType: CONDENSATION_TYPE.LIKERT.PROS
      })
    ).rejects.toThrow('No valid comments found');
  });
});
