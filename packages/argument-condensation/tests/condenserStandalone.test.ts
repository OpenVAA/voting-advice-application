import { describe, expect, it, vi } from 'vitest';
import { Condenser } from '../src/core/condensation/condenser';
import { PromptRegistry } from '../src/core/condensation/prompts/promptRegistry';
import { CONDENSATION_TYPE } from '../src/core/types';
import type { CondensationRunInput } from '../src/core/types';

// Define minimal LLM Provider interface
interface MockLLMProvider {
  generate: ReturnType<typeof vi.fn>;
  generateMultipleParallel: ReturnType<typeof vi.fn>;
  generateMultipleSequential: ReturnType<typeof vi.fn>;
  countTokens: ReturnType<typeof vi.fn>;
}

// Mock LLM Provider
function createMockLLMProvider(): MockLLMProvider {
  return {
    generate: vi.fn().mockResolvedValue({
      content: JSON.stringify({
        arguments: [
          { id: 'arg1', text: 'Lower voting age increases youth participation' },
          { id: 'arg2', text: 'Young people are informed about local issues' }
        ],
        reasoning: 'These arguments support lowering the voting age'
      }),
      model: 'gpt-4o-mini',
      usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 }
    }),
    generateMultipleParallel: vi.fn().mockImplementation(({ inputs }) => {
      const mockResponse = {
        content: JSON.stringify({
          arguments: [
            { id: 'arg1', text: 'Generated argument from batch' },
            { id: 'arg2', text: 'Another generated argument' }
          ],
          reasoning: 'Batch processing reasoning'
        }),
        model: 'gpt-4o-mini',
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 }
      };
      return Promise.resolve(Array(inputs.length).fill(mockResponse));
    }),
    generateMultipleSequential: vi.fn().mockImplementation(async (inputs: Array<unknown>) => {
      const results: Array<unknown> = [];
      for (let i = 0; i < inputs.length; i++) {
        results.push({
          content: JSON.stringify({
            arguments: [{ id: `seq-arg-${i}`, text: `Sequential argument ${i}` }],
            reasoning: `Sequential reasoning ${i}`
          }),
          model: 'gpt-4o-mini',
          usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 }
        });
      }
      return results;
    }),
    countTokens: vi.fn().mockResolvedValue(100)
  };
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
    candidateID: 'candidate-1',
    candidateAnswer: 5,
    text: 'Young people should have a voice in decisions that affect their future'
  },
  {
    id: 'comment-2',
    candidateID: 'candidate-2',
    candidateAnswer: 5,
    text: 'Lowering voting age would increase civic engagement among youth'
  },
  {
    id: 'comment-3',
    candidateID: 'candidate-3',
    candidateAnswer: 4,
    text: 'Teenagers are well-informed about local issues through school programs'
  },
  {
    id: 'comment-4',
    candidateID: 'candidate-4',
    candidateAnswer: 1,
    text: 'Young people lack the maturity to make informed voting decisions'
  },
  {
    id: 'comment-5',
    candidateID: 'candidate-5',
    candidateAnswer: 2,
    text: 'Sixteen-year-olds are not yet fully developed cognitively for such decisions'
  }
];

describe('Condenser Standalone Test', () => {
  it('should run the complete condensation pipeline with mock data', async () => {
    // Initialize prompt registry
    await PromptRegistry.create('en');

    // Create condensation input
    const input = {
      question: mockQuestion,
      comments: mockComments,
      options: {
        runId: 'standalone-test-1',
        outputType: CONDENSATION_TYPE.LIKERT.PROS,
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
        llmProvider: createMockLLMProvider()
      }
    };

    // Run condensation
    const condenser = new Condenser(input as unknown as CondensationRunInput);
    const result = await condenser.run();

    // Verify results
    expect(result).toBeDefined();
    expect(result.condensationType).toBe(CONDENSATION_TYPE.LIKERT.PROS);

    // Check metrics
    expect(result.metrics).toBeDefined();
    expect(result.metrics.nLlmCalls).toBeGreaterThan(0);
    expect(result.metrics.duration).toBeGreaterThan(0);
    expect(result.metrics.tokensUsed).toBeDefined();
    expect(result.metrics.tokensUsed.total).toBeGreaterThan(0);

    // Verify LLM provider was called
    expect(input.options.llmProvider.generateMultipleParallel).toHaveBeenCalled();
  }, 30000); // 30 second timeout for the full pipeline

  it('should handle different condensation types', async () => {
    const input = {
      question: mockQuestion,
      comments: mockComments.filter((c) => c.candidateAnswer <= 2), // Only negative comments
      options: {
        runId: 'standalone-test-cons',
        outputType: CONDENSATION_TYPE.LIKERT.CONS,
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
        llmProvider: createMockLLMProvider()
      }
    };

    const condenser = new Condenser(input as unknown as CondensationRunInput);
    const result = await condenser.run();

    expect(result.condensationType).toBe(CONDENSATION_TYPE.LIKERT.CONS);
    expect(result.metrics.nLlmCalls).toBeGreaterThan(0);
  });

  it('should handle empty comments gracefully', async () => {
    const input = {
      question: mockQuestion,
      comments: [], // No comments
      options: {
        runId: 'standalone-test-empty',
        outputType: CONDENSATION_TYPE.LIKERT.PROS,
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
        llmProvider: createMockLLMProvider()
      }
    };

    // This should either handle gracefully or throw a meaningful error
    await expect(async () => {
      const condenser = new Condenser(input as unknown as CondensationRunInput);
      await condenser.run();
    }).rejects.toThrow(); // Expect it to throw for empty comments
  });
});
