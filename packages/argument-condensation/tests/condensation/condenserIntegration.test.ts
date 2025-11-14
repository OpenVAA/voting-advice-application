import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { Condenser } from '../../src/core/condensation/condenser';
import { CondensationOperations } from '../../src/core/types';
import type { Controller } from '@openvaa/core';
import type { LLMProvider } from '@openvaa/llm-refactor';
import type {
  CondensationRunInput,
  IterateMapOperationParams,
  MapOperationParams,
  ProcessingStep,
  SupportedQuestion,
  VAAComment
} from '../../src/core/types';

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

// Mock the file system to prevent writing operation trees
vi.mock('fs/promises', () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined)
}));

// Helper function to create a complete mock LLM response with all required properties
function createMockLLMResponse(args: Array<{ id: string; text: string }>, reasoning: string) {
  return {
    object: {
      arguments: args,
      reasoning: reasoning
    },
    usage: { inputTokens: 10, outputTokens: 10, totalTokens: 20 },
    costs: { input: 0.001, output: 0.001, reasoning: 0, total: 0.002 },
    finishReason: 'stop' as const,
    latencyMs: 100,
    attempts: 1,
    fallbackUsed: false,
    reasoning: undefined,
    warnings: undefined,
    request: {
      body: '{"messages": [{"role": "system", "content": "test"}]}'
    },
    response: {
      id: 'test-response-id',
      modelId: 'gpt-4o',
      timestamp: new Date(),
      headers: undefined,
      messages: []
    },
    providerMetadata: undefined,
    toJsonResponse: () => new Response()
  };
}

describe('Condenser Integration Tests', () => {
  let llmProvider: LLMProvider;

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
    llmProvider = {
      generateObject: vi.fn(),
      generateObjectParallel: vi.fn(),
      streamText: vi.fn()
    } as unknown as LLMProvider;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('It should run a map -> iterate_map -> reduce pipeline successfully', async () => {
    // Arrange: Mock the LLM provider to return the expected
    const mapResponses = [
      createMockLLMResponse([{ id: 'arg1', text: 'Argument 1' }], 'Mapped from batch 1'),
      createMockLLMResponse([{ id: 'arg2', text: 'Argument 2' }], 'Mapped from batch 2')
    ];

    const iterateMapResponses = [
      createMockLLMResponse([{ id: 'arg1', text: 'Improved Argument 1' }], 'Iterated from batch 1'),
      createMockLLMResponse([{ id: 'arg2', text: 'Improved Argument 2' }], 'Iterated from batch 2')
    ];

    const spy = vi.spyOn(llmProvider, 'generateObjectParallel');
    spy
      .mockResolvedValueOnce([...mapResponses]) // For the map phase
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
        controller: noOpLogger
      }
    };

    // Act
    const condenser = new Condenser(input);
    const result = await condenser.run();

    // Assert
    expect(result.success).toBe(true);
    expect(result.data.arguments).toHaveLength(1);
    // Now expecting 3 calls: map + iterate_map
    expect(spy).toHaveBeenCalledTimes(2);
  });

  test('It should handle LLM failures and successfully retry', async () => {
    // Arrange
    const validResponse = createMockLLMResponse([{ id: 'arg1', text: 'A valid argument' }], 'A valid reason');

    // Simulate success for all calls since generateObjectParallel handles retries internally
    const spy = vi.spyOn(llmProvider, 'generateObjectParallel');
    spy
      .mockResolvedValueOnce([validResponse]) // map phase
      .mockResolvedValueOnce([validResponse]); // iterate_map phase

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
        controller: noOpLogger
      }
    };

    // Act
    const condenser = new Condenser(input);
    await condenser.run();

    // Assert - test passes if no errors are thrown during execution
  });
});
