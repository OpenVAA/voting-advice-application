import {
  type Answer,
  BooleanQuestion,
  DataRoot,
  QUESTION_TYPE,
  SingleChoiceCategoricalQuestion,
  SingleChoiceOrdinalQuestion
} from '@openvaa/data';
import { describe, expect, test, vi } from 'vitest';
import { handleQuestion } from '../../src/api.ts';
import { CONDENSATION_TYPE } from '../../src/core/types/index.ts';
import type { Controller, HasAnswers } from '@openvaa/core';
import type { LLMProvider, ParsedLLMResponse } from '@openvaa/llm';
import type { ResponseWithArguments } from '../../src/core/types/index.ts';

// No-op controller for tests to prevent logging output
const noOpLogger: Controller = {
  info: () => {},
  warning: () => {},
  error: () => {},
  progress: () => {}
};

// Mock LLM Provider
const mockLLMProvider: LLMProvider = {
  name: 'mock',
  generate: vi.fn().mockResolvedValue({
    content:
      '{"arguments": [{"id": "arg1", "text": "Test argument 1"}, {"id": "arg2", "text": "Test argument 2"}], "reasoning": "Test reasoning for arguments"}',
    model: 'gpt-4o-mini',
    usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 }
  }),
  generateWithRetry: vi.fn().mockImplementation(({ messages, temperature, maxTokens, model }) => {
    return mockLLMProvider.generate({ messages, temperature, maxTokens, model });
  }),
  generateMultipleParallel: vi.fn().mockImplementation(({ inputs }) => {
    const parsedContent: ResponseWithArguments = {
      arguments: [
        { id: 'arg1', text: 'Test argument 1' },
        { id: 'arg2', text: 'Test argument 2' }
      ],
      reasoning: 'Test reasoning for arguments'
    };
    const mockResponse: ParsedLLMResponse<ResponseWithArguments> = {
      parsed: parsedContent,
      raw: {
        content: JSON.stringify(parsedContent),
        model: 'gpt-4o-mini',
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 }
      }
    };
    return Promise.resolve(Array(inputs.length).fill(mockResponse));
  }),
  generateMultipleSequential: vi.fn().mockResolvedValue([]),
  generateAndValidateWithRetry: vi.fn()
};

describe('handleQuestion', () => {
  test('It should condense arguments for both pros and cons of a likert question', async () => {
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
      options: {
        llmProvider: mockLLMProvider,
        llmModel: 'gpt-4o',
        language: 'en',
        runId: 'test-run',
        maxCommentsPerGroup: 1000,
        controller: noOpLogger
      }
    });

    // Verify results
    expect(results).toBeDefined();
    expect(results).toHaveLength(2); // Should have one result for pros, one for cons

    // Check that we have one of each type
    const types = results.map((r) => r.condensationType);
    expect(types).toContain(CONDENSATION_TYPE.LikertPros);
    expect(types).toContain(CONDENSATION_TYPE.LikertCons);
  });

  test('It should condense arguments for a categorical question', async () => {
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
      options: {
        llmProvider: mockLLMProvider,
        llmModel: 'gpt-4o',
        language: 'en',
        runId: 'test-run',
        maxCommentsPerGroup: 1000,
        controller: noOpLogger
      }
    });

    // Verify results
    expect(results).toBeDefined();
    expect(results).toHaveLength(3); // Should have one result for 'cat1', 'cat2', and 'cat3'

    // Check that all condensation results are of type PROS
    expect(results.every((r) => r.condensationType === CONDENSATION_TYPE.CategoricalPros)).toBe(true);
  });

  test('It should condense arguments for a boolean question', async () => {
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
      options: {
        llmProvider: mockLLMProvider,
        llmModel: 'gpt-4o',
        language: 'en',
        runId: 'test-run',
        maxCommentsPerGroup: 1000,
        controller: noOpLogger
      }
    });

    // Verify results
    expect(results).toBeDefined();
    expect(results).toHaveLength(2); // Should have one result for pros, one for cons

    // Check that we have one of each type
    const types = results.map((r) => r.condensationType);
    expect(types).toContain(CONDENSATION_TYPE.BooleanPros);
    expect(types).toContain(CONDENSATION_TYPE.BooleanCons);
  });

  test('It should throw an error if invalid prompt IDs are provided', async () => {
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
          'boolean-question': { value: true, info: 'I agree with this.' } as Answer
        }
      },
      {
        answers: {
          'boolean-question': { value: false, info: 'I do not agree with this.' } as Answer
        }
      }
    ];

    // Run condensation with absurd prompt IDs and expect it to fail
    await expect(
      handleQuestion({
        question,
        entities,
        options: {
          llmProvider: mockLLMProvider,
          llmModel: 'gpt-4o',
          language: 'en',
          runId: 'test-run-invalid-prompts',
          maxCommentsPerGroup: 1000,
          controller: noOpLogger,
          prompts: {
            [CONDENSATION_TYPE.BooleanPros]: {
              map: 'map-pros-42-haha',
              reduce: 'reduce-pros-42-haha',
              mapIteration: 'map-iterate-pros-42-haha'
            },
            [CONDENSATION_TYPE.BooleanCons]: {
              map: 'map-cons-42-haha',
              reduce: 'reduce-cons-42-haha',
              mapIteration: 'map-iterate-cons-42-haha'
            }
          }
        }
      })
    ).rejects.toThrow();
  });

  test('It should create visualization data when createVisualization flag is set', async () => {
    // Create a unique ID using date + test identifier
    const now = new Date();
    const uniqueId = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}-${now.getSeconds().toString().padStart(2, '0')}-tree-data-test`;

    // Create a simple boolean question
    const question = new BooleanQuestion({
      data: {
        id: 'viz-test-question',
        type: QUESTION_TYPE.Boolean,
        name: 'Visualization test question',
        categoryId: 'test-category'
      },
      root: new DataRoot()
    });

    // Create entities with both true and false answers (to generate both pros and cons)
    const entities: Array<HasAnswers> = [
      {
        answers: {
          'viz-test-question': {
            value: true,
            info: 'Test comment for pros'
          } as Answer
        }
      },
      {
        answers: {
          'viz-test-question': {
            value: false,
            info: 'Test comment for cons'
          } as Answer
        }
      }
    ];

    // Run condensation with visualization enabled
    const results = await handleQuestion({
      question,
      entities,
      options: {
        llmProvider: mockLLMProvider,
        llmModel: 'gpt-4o',
        language: 'en',
        runId: uniqueId,
        maxCommentsPerGroup: 1000,
        createVisualizationData: true // We are testing the createVisualizationData flag
      }
    });

    // Verify results
    expect(results).toBeDefined();
    expect(results).toHaveLength(2); // Should have pros and cons

    // Check that BOTH tree files were created
    const fs = await import('fs');
    const path = await import('path');

    const expectedProsPath = path.join(process.cwd(), 'data/operationTrees', `${uniqueId}-pros.json`);
    const expectedConsPath = path.join(process.cwd(), 'data/operationTrees', `${uniqueId}-cons.json`);

    expect(fs.existsSync(expectedProsPath)).toBe(true);
    expect(fs.existsSync(expectedConsPath)).toBe(true);

    // Verify the files contain valid JSON
    const prosData = JSON.parse(fs.readFileSync(expectedProsPath, 'utf8'));
    const consData = JSON.parse(fs.readFileSync(expectedConsPath, 'utf8'));

    expect(prosData.runId).toBe(`${uniqueId}-pros`);
    expect(consData.runId).toBe(`${uniqueId}-cons`);
    expect(prosData.nodes).toBeDefined();
    expect(consData.nodes).toBeDefined();

    // Remove the created visualization data files because they were only for testing :)
    if (fs.existsSync(expectedProsPath)) fs.unlinkSync(expectedProsPath);
    if (fs.existsSync(expectedConsPath)) fs.unlinkSync(expectedConsPath);
  });
});
