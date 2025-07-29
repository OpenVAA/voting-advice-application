import {
  type Answer,
  BooleanQuestion,
  DataRoot,
  QUESTION_TYPE,
  SingleChoiceCategoricalQuestion,
  SingleChoiceOrdinalQuestion
} from '@openvaa/data';
import { describe, expect, it, vi } from 'vitest';
import { CONDENSATION_TYPE } from '../new_src/core/types';
import { handleQuestion } from '../new_src/main.ts';
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
      },
      {
        answers: {
          'test-question': {
            value: '2',
            info: 'I disagree somewhat.'
          } as Answer
        }
      },
      {
        answers: {
          'test-question': {
            value: '3',
            info: 'I am neutral about this.'
          } as Answer
        }
      },
      {
        answers: {
          'test-question': {
            value: '4',
            info: 'I agree somewhat.'
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

  it('should condense arguments for a categorical question', async () => {
    // Create a categorical question
    const question = new SingleChoiceCategoricalQuestion({
      data: {
        id: 'categorical-question',
        type: QUESTION_TYPE.SingleChoiceCategorical,
        name: 'Test categorical question',
        categoryId: 'test-category',
        choices: [
          { id: 'cat1', label: 'Category 1' },
          { id: 'cat2', label: 'Category 2' },
          { id: 'cat3', label: 'Category 3' }
        ]
      },
      root: new DataRoot()
    });

    // Create entities with answers
    const entities: Array<HasAnswers> = [
      {
        answers: {
          'categorical-question': {
            value: 'cat1',
            info: 'This is a comment for category 1.'
          } as Answer
        }
      },
      {
        answers: {
          'categorical-question': {
            value: 'cat2',
            info: 'This is a comment for category 2.'
          } as Answer
        }
      },
      {
        answers: {
          'categorical-question': {
            value: 'cat1',
            info: 'Another comment for category 1.'
          } as Answer
        }
      },
      {
        answers: {
          'categorical-question': {
            value: 'cat3',
            info: 'This is a comment for category 3.'
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
    expect(results).toHaveLength(3); // Should have one result for 'cat1', 'cat2', and 'cat3'

    // Check that all condensation results are of type PROS
    expect(results.every((r) => r.condensationType === CONDENSATION_TYPE.CATEGORICAL.PROS)).toBe(true);
  });

  it('should condense arguments for a boolean question', async () => {
    // Create a boolean question
    const question = new BooleanQuestion({
      data: {
        id: 'boolean-question',
        type: QUESTION_TYPE.Boolean,
        name: 'Test boolean question',
        categoryId: 'test-category'
      },
      root: new DataRoot()
    });

    // Create entities with answers that have info text
    const entities: Array<HasAnswers> = [
      {
        answers: {
          'boolean-question': {
            value: true,
            info: 'I agree with this.'
          } as Answer
        }
      },
      {
        answers: {
          'boolean-question': {
            value: false,
            info: 'I do not agree with this.'
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
    expect(types).toContain(CONDENSATION_TYPE.BOOLEAN.PROS);
    expect(types).toContain(CONDENSATION_TYPE.BOOLEAN.CONS);
  });
});
