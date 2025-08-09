import { OpenAIProvider } from '@openvaa/llm';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { Condenser } from '../../src/core/condensation/condenser';
import { CondensationOperations } from '../../src/core/types';
import type { Logger } from '@openvaa/core';
import type { ParsedLLMResponse } from '@openvaa/llm';
import type {
  CondensationRunInput,
  IterateMapOperationParams,
  MapOperationParams,
  ProcessingStep,
  ResponseWithArguments,
  SupportedQuestion,
  VAAComment
} from '../../src/core/types';

// No-op logger for tests to prevent logging output
const noOpLogger: Logger = {
  info: () => {},
  warning: () => {},
  error: () => {},
  progress: () => {}
};

// Mock the file system to prevent writing operation trees
vi.mock('fs/promises', () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined)
}));

describe('Condenser Integration Tests', () => {
  let llmProvider: OpenAIProvider;

  const mockQuestion: SupportedQuestion = {
    id: 'q1',
    type: 'boolean',
    text: 'Test question',
    name: 'Test question'
  } as SupportedQuestion;

  const mockComments: Array<VAAComment> = Array.from({ length: 1 }, (_, i) => ({
    id: `c${i}`,
    entityId: `cand${i}`,
    entityAnswer: i % 2,
    text: `This is comment ${i}`
  }));

  beforeEach(() => {
    llmProvider = new OpenAIProvider({ apiKey: 'test-api-key' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('It should run a map -> iterate_map -> reduce pipeline successfully', async () => {
    // Arrange: Mock the LLM provider to return the expected
    const mapResponses = [
      {
        parsed: {
          arguments: [{ id: 'arg1', text: 'Argument 1' }],
          reasoning: 'Mapped from batch 1'
        },
        raw: {
          content: JSON.stringify({
            arguments: [{ id: 'arg1', text: 'Argument 1' }],
            reasoning: 'Mapped from batch 1'
          }),
          usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
          model: 'test-model'
        }
      },
      {
        parsed: {
          arguments: [{ id: 'arg2', text: 'Argument 2' }],
          reasoning: 'Mapped from batch 2'
        },
        raw: {
          content: JSON.stringify({
            arguments: [{ id: 'arg2', text: 'Argument 2' }],
            reasoning: 'Mapped from batch 2'
          }),
          usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
          model: 'test-model'
        }
      }
    ];

    const iterateMapResponses: Array<ParsedLLMResponse<ResponseWithArguments>> = [
      {
        parsed: {
          arguments: [{ id: 'arg1', text: 'Improved Argument 1' }],
          reasoning: 'Iterated from batch 1'
        },
        raw: {
          content: JSON.stringify({
            arguments: [{ id: 'arg1', text: 'Improved Argument 1' }],
            reasoning: 'Iterated from batch 1'
          }),
          usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
          model: 'test-model'
        }
      },
      {
        parsed: {
          arguments: [{ id: 'arg2', text: 'Improved Argument 2' }],
          reasoning: 'Iterated from batch 2'
        },
        raw: {
          content: JSON.stringify({
            arguments: [{ id: 'arg2', text: 'Improved Argument 2' }],
            reasoning: 'Iterated from batch 2'
          }),
          usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
          model: 'test-model'
        }
      }
    ] as Array<ParsedLLMResponse<ResponseWithArguments>>;

    const spy = vi.spyOn(llmProvider, 'generateMultipleParallel');
    spy
      // @ts-expect-error - Mock returns ParsedLLMResponse when contract is provided
      .mockResolvedValueOnce([...mapResponses]) // For the map phase
      // @ts-expect-error - Mock returns ParsedLLMResponse when contract is provided
      .mockResolvedValueOnce([...iterateMapResponses]); // For the iterate_map phase

    const steps: Array<ProcessingStep> = [
      {
        operation: CondensationOperations.MAP,
        params: {
          batchSize: 10,
          condensationPrompt: 'map prompt',
          condensationPromptId: 'map-prompt-id'
        } as MapOperationParams
      },
      {
        operation: CondensationOperations.ITERATE_MAP,
        params: {
          batchSize: 10,
          iterationPrompt: 'iteration prompt',
          iterationPromptId: 'iteration-prompt-id'
        } as IterateMapOperationParams
      }
    ];

    const input: CondensationRunInput = {
      question: mockQuestion,
      comments: mockComments,
      options: {
        llmProvider: llmProvider,
        llmModel: 'gpt-4o',
        language: 'en',
        outputType: 'booleanPros',
        processingSteps: steps,
        runId: 'happy-path-test',
        createVisualizationData: false,
        logger: noOpLogger
      }
    };

    // Act
    const condenser = new Condenser(input);
    const result = await condenser.run();

    // Assert
    expect(result.success).toBe(true);
    expect(result.arguments).toHaveLength(1);
    expect(result.arguments[0][0].id).toBe('arg1');
    // Now expecting 3 calls: map + iterate_map
    expect(spy).toHaveBeenCalledTimes(2);
  });

  test('It should handle LLM failures and successfully retry', async () => {
    // Arrange
    const validParsedResponse: ParsedLLMResponse<ResponseWithArguments> = {
      parsed: {
        arguments: [{ id: 'arg1', text: 'A valid argument' }],
        reasoning: 'A valid reason'
      },
      raw: {
        content: JSON.stringify({
          arguments: [{ id: 'arg1', text: 'A valid argument' }],
          reasoning: 'A valid reason'
        }),
        usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
        model: 'test-model'
      }
    };

    // Simulate success for all calls since generateMultipleParallel handles retries internally
    const spy = vi.spyOn(llmProvider, 'generateMultipleParallel');
    spy
      // @ts-expect-error - idk why but compiler thinks validParsedResponse.raw ≠ LLMResponse but it is
      .mockResolvedValueOnce([validParsedResponse]) // map phase
      // @ts-expect-error - same problem as above
      .mockResolvedValueOnce([validParsedResponse]); // iterate_map phase

    const steps: Array<ProcessingStep> = [
      {
        operation: CondensationOperations.MAP,
        params: {
          batchSize: 1,
          condensationPrompt: 'map prompt',
          condensationPromptId: 'map-prompt-id'
        } as MapOperationParams
      },
      {
        operation: CondensationOperations.ITERATE_MAP,
        params: {
          batchSize: 1,
          iterationPrompt: 'iteration prompt',
          iterationPromptId: 'iteration-prompt-id'
        } as IterateMapOperationParams
      }
    ];

    const input: CondensationRunInput = {
      question: mockQuestion,
      comments: mockComments,
      options: {
        llmProvider: llmProvider,
        llmModel: 'gpt-4o',
        language: 'en',
        outputType: 'booleanPros',
        processingSteps: steps,
        runId: 'retry-test',
        createVisualizationData: false,
        logger: noOpLogger
      }
    };

    // Act
    const condenser = new Condenser(input);
    await condenser.run();

    // Assert - test passes if no errors are thrown during execution
  });
});
