import { type Answer, DataRoot, QUESTION_TYPE, SingleChoiceOrdinalQuestion } from '@openvaa/data';
import { describe, expect, it, vi } from 'vitest';
import { handleQuestion } from '../new_src/core/orchestration/handleQuestion';
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
  countTokens: vi.fn().mockResolvedValue(100)
};

describe('handleQuestion', () => {
  it('should condense arguments for both pros and cons of a likert question', async () => {
    // Create a 5-point likert question
    const question = new SingleChoiceOrdinalQuestion({
      data: {
        id: 'test-question',
        type: QUESTION_TYPE.SingleChoiceOrdinal,
        name: 'Test likert question',
        categoryId: 'test-category',
        choices: [
          { id: '1', label: 'Strongly disagree', normalizableValue: 0 },
          { id: '2', label: 'Disagree', normalizableValue: 0.25 },
          { id: '3', label: 'Neutral', normalizableValue: 0.5 },
          { id: '4', label: 'Agree', normalizableValue: 0.75 },
          { id: '5', label: 'Strongly agree', normalizableValue: 1 }
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
    const results = await handleQuestion({
      question,
      entities,
      llmProvider: mockLLMProvider,
      language: 'en'
    });

    // Verify results
    expect(results).toBeDefined();
    expect(results).toHaveLength(2); // Should have one result for pros, one for cons

    // Check that we have one of each type
    const types = results.map((r) => r.condensationType);
    expect(types).toContain(CONDENSATION_TYPE.LIKERT.PROS);
    expect(types).toContain(CONDENSATION_TYPE.LIKERT.CONS);
  });

  it('should return an empty array when no valid comments are found', async () => {
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

    const results = await handleQuestion({
      question,
      entities,
      llmProvider: mockLLMProvider,
      language: 'en'
    });

    expect(results).toEqual([]);
  });
});
