import { LLMResponse, OpenAIProvider } from '@openvaa/llm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Condenser } from '../../src/core/condensation/condenser';
import {
  CondensationOperations,
  CondensationRunInput,
  MapOperationParams,
  ProcessingStep,
  ReduceOperationParams,
  SupportedQuestion,
  VAAComment
} from '../../src/core/types';

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
    candidateID: `cand${i}`,
    candidateAnswer: i % 2,
    text: `This is comment ${i}`
  }));

  beforeEach(() => {
    llmProvider = new OpenAIProvider({ apiKey: 'test-api-key' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should run a MAP -> REDUCE pipeline successfully', async () => {
    // Arrange
    const mapResponses: Array<LLMResponse> = [
      {
        content: JSON.stringify({
          arguments: [{ id: 'arg1', text: 'Argument 1' }],
          reasoning: 'Mapped from batch 1'
        }),
        usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
        model: 'test-model'
      },
      {
        content: JSON.stringify({
          arguments: [{ id: 'arg2', text: 'Argument 2' }],
          reasoning: 'Mapped from batch 2'
        }),
        usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
        model: 'test-model'
      }
    ];

    const reduceResponse: LLMResponse = {
      content: JSON.stringify({
        arguments: [
          { id: 'arg1', text: 'Argument 1' },
          { id: 'arg2', text: 'Argument 2' }
        ],
        reasoning: 'Reduced arguments'
      }),
      usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
      model: 'test-model'
    };

    const generateMultipleParallelSpy = vi
      .spyOn(llmProvider, 'generateMultipleParallel')
      .mockResolvedValueOnce([...mapResponses]) // For the MAP phase
      .mockResolvedValueOnce([...mapResponses]) // For the ITERATE_MAP phase
      .mockResolvedValueOnce([reduceResponse]); // For the REDUCE phase

    const steps: Array<ProcessingStep> = [
      {
        operation: CondensationOperations.MAP,
        params: {
          batchSize: 10,
          condensationPrompt: 'map prompt',
          condensationPromptId: 'map-prompt-id',
          iterationPrompt: 'iteration prompt',
          iterationPromptId: 'iteration-prompt-id'
        } as MapOperationParams
      },
      {
        operation: CondensationOperations.REDUCE,
        params: {
          denominator: 2,
          coalescingPrompt: 'reduce prompt',
          coalescingPromptId: 'reduce-prompt-id'
        } as ReduceOperationParams
      }
    ];

    const input: CondensationRunInput = {
      question: mockQuestion,
      comments: mockComments,
      options: {
        llmProvider: llmProvider,
        language: 'en',
        outputType: 'booleanPros',
        processingSteps: steps,
        runId: 'happy-path-test'
      }
    };

    // Act
    const condenser = new Condenser(input);
    const result = await condenser.run();

    // Assert
    expect(result.success).toBe(true);
    expect(result.arguments).toHaveLength(1);
    expect(result.arguments[0][0].id).toBe('arg1');
    expect(generateMultipleParallelSpy).toHaveBeenCalledTimes(2);
  });
  it('should handle LLM failures and successfully retry', async () => {
    // Arrange
    const malformedResponse: LLMResponse = {
      content: 'This is not valid JSON',
      usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
      model: 'test-model'
    };
    const validResponse: LLMResponse = {
      content: JSON.stringify({
        arguments: [{ id: 'arg1', text: 'A valid argument' }],
        reasoning: 'A valid reason'
      }),
      usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
      model: 'test-model'
    };

    // Simulate a failure on the first call, then success.
    vi.spyOn(llmProvider, 'generateMultipleParallel')
      .mockResolvedValueOnce([malformedResponse, validResponse])
      .mockResolvedValueOnce([validResponse, validResponse]); // For the ITERATE_MAP phase

    const generateSpy = vi.spyOn(llmProvider, 'generate').mockResolvedValue(validResponse);

    const steps: Array<ProcessingStep> = [
      {
        operation: CondensationOperations.MAP,
        params: {
          batchSize: 1,
          condensationPrompt: 'map prompt',
          condensationPromptId: 'map-prompt-id',
          iterationPrompt: 'iteration prompt',
          iterationPromptId: 'iteration-prompt-id'
        } as MapOperationParams
      }
    ];

    const input: CondensationRunInput = {
      question: mockQuestion,
      comments: mockComments,
      options: {
        llmProvider: llmProvider,
        language: 'en',
        outputType: 'booleanPros',
        processingSteps: steps,
        runId: 'retry-test'
      }
    };

    // Act
    const condenser = new Condenser(input);
    await condenser.run();

    // Assert
    expect(generateSpy).toHaveBeenCalled();
  });
});
