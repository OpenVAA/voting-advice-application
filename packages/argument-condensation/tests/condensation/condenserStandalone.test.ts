import { describe, expect, test, vi } from 'vitest';
import { Condenser } from '../../src/core/condensation/condenser';
import { PromptRegistry } from '../../src/core/condensation/prompts/promptRegistry';
import { CONDENSATION_TYPE } from '../../src/core/types';
import type { Controller } from '@openvaa/core';
import type { LLMProvider } from '@openvaa/llm-refactor';
import type { CondensationRunInput } from '../../src/core/types';

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

// Mock LLM Provider for new API
function createMockLLMProvider() {
  return {
    generateObject: vi.fn().mockResolvedValue({
      object: {
        arguments: [
          { id: 'arg1', text: 'Lower voting age increases youth participation' },
          { id: 'arg2', text: 'Young people are informed about local issues' }
        ],
        reasoning: 'These arguments support lowering the voting age'
      },
      usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
      costs: Promise.resolve({ input: 0.001, output: 0.002, reasoning: 0, total: 0.003 }),
      finishReason: 'stop' as const,
      latencyMs: 100,
      attempts: 1,
      fallbackUsed: false
    }),
    generateObjectParallel: vi.fn().mockImplementation(({ requests }) => {
      const mockResponse = {
        object: {
          arguments: [
            { id: 'arg1', text: 'Generated argument from batch' },
            { id: 'arg2', text: 'Another generated argument' }
          ],
          reasoning: 'Batch processing reasoning'
        },
        usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
        costs: Promise.resolve({ input: 0.001, output: 0.002, reasoning: 0, total: 0.003 }),
        finishReason: 'stop' as const,
        latencyMs: 100,
        attempts: 1,
        fallbackUsed: false
      };
      return Promise.resolve(Array(requests.length).fill(mockResponse));
    })
  } as unknown as LLMProvider;
}

// Mock question object (minimal interface)
const mockQuestion = {
  id: 'test-question',
  type: 'singleChoiceOrdinal' as const,
  text: 'Should the voting age be lowered to 16 in municipal elections?'
};

// Test data
const mockComments = [
  {
    id: 'comment-1',
    entityId: 'candidate-1',
    entityAnswer: 5,
    text: 'Young people should have a voice in decisions that affect their future'
  },
  {
    id: 'comment-2',
    entityId: 'candidate-2',
    entityAnswer: 5,
    text: 'Lowering voting age would increase civic engagement among youth'
  },
  {
    id: 'comment-3',
    entityId: 'candidate-3',
    entityAnswer: 4,
    text: 'Teenagers are well-informed about local issues through school programs'
  },
  {
    id: 'comment-4',
    entityId: 'candidate-4',
    entityAnswer: 1,
    text: 'Young people lack the maturity to make informed voting decisions'
  },
  {
    id: 'comment-5',
    entityId: 'candidate-5',
    entityAnswer: 2,
    text: 'Sixteen-year-olds are not yet fully developed cognitively for such decisions'
  }
];

describe('Condenser Standalone Test', () => {
  test('It should run the complete condensation pipeline with mock data', async () => {
    // Initialize prompt registry
    await PromptRegistry.create('en');

    // Create condensation input
    const input = {
      question: mockQuestion,
      comments: mockComments,
      options: {
        runId: 'standalone-test-1',
        outputType: CONDENSATION_TYPE.LikertPros,
        processingSteps: [
          {
            operation: 'MAP' as const,
            params: {
              batchSize: 3,
              condensationPrompt:
                'Extract and summarize the main arguments from these comments that support the position.',
              iterationPrompt: 'Refine the arguments based on feedback and ensure clarity.'
            }
          },
          {
            operation: 'REDUCE' as const,
            params: {
              denominator: 2,
              coalescingPrompt:
                'Combine similar arguments into cohesive statements while preserving unique perspectives.'
            }
          }
        ],
        llmProvider: createMockLLMProvider(),
        controller: noOpLogger
      }
    };

    // Run condensation
    const condenser = new Condenser(input as unknown as CondensationRunInput);
    const result = await condenser.run();

    // Verify results
    expect(result).toBeDefined();
    expect(result.condensationType).toBe(CONDENSATION_TYPE.LikertPros);

    // Check metrics
    expect(result.metrics).toBeDefined();
    expect(result.metrics.nLlmCalls).toBeGreaterThan(0);
    expect(result.metrics.duration).toBeGreaterThan(0);
    expect(result.metrics.tokensUsed).toBeDefined();
    expect(result.metrics.tokensUsed.total).toBeGreaterThan(0);

    // Verify LLM provider was called
    expect(input.options.llmProvider.generateObjectParallel).toHaveBeenCalled();
  }, 30000); // 30 second timeout for the full pipeline

  test('It should handle different condensation types', async () => {
    const input = {
      question: mockQuestion,
      comments: mockComments.filter((c) => c.entityAnswer <= 2), // Only negative comments
      options: {
        runId: 'standalone-test-cons',
        outputType: CONDENSATION_TYPE.LikertCons,
        processingSteps: [
          {
            operation: 'MAP' as const,
            params: {
              batchSize: 2,
              condensationPrompt: 'Extract arguments that oppose the position.',
              iterationPrompt: 'Refine opposing arguments.'
            }
          },
          {
            operation: 'REDUCE' as const,
            params: {
              denominator: 2,
              coalescingPrompt:
                'Combine similar arguments into cohesive statements while preserving unique perspectives.'
            }
          }
        ],
        llmProvider: createMockLLMProvider(),
        controller: noOpLogger
      }
    };

    const condenser = new Condenser(input as unknown as CondensationRunInput);
    const result = await condenser.run();

    expect(result.condensationType).toBe(CONDENSATION_TYPE.LikertCons);
    expect(result.metrics.nLlmCalls).toBeGreaterThan(0);
  });

  test('It should handle empty comments gracefully', async () => {
    const input = {
      question: mockQuestion,
      comments: [], // No comments
      options: {
        runId: 'standalone-test-empty',
        outputType: CONDENSATION_TYPE.LikertPros,
        processingSteps: [
          {
            operation: 'MAP' as const,
            params: {
              batchSize: 1,
              condensationPrompt: 'Extract arguments.',
              iterationPrompt: 'Refine arguments.'
            }
          }
        ],
        llmProvider: createMockLLMProvider(),
        controller: noOpLogger
      }
    };

    // This should either handle gracefully or throw a meaningful error
    await expect(async () => {
      const condenser = new Condenser(input as unknown as CondensationRunInput);
      await condenser.run();
    }).rejects.toThrow(); // Expect it to throw for empty comments
  });
});
