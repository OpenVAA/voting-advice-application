import { beforeEach, describe, expect, test, vi } from 'vitest';
import { PromptRegistry } from '../../src/core/condensation/prompts/promptRegistry';
import { CONDENSATION_TYPE, CondensationOperations } from '../../src/core/types';
import { createCondensationSteps } from '../../src/core/utils/condensation/defineCondensationSteps';
import { validatePlan } from '../../src/core/utils/condensation/planValidation';
import type { VAAComment } from '../../src/core/types';
import type { MapPrompt, ReducePrompt } from '../../src/core/types/llm/prompt';

vi.mock('../../src/core/condensation/prompts/promptRegistry');
vi.mock('../../src/core/utils/condensation/validateInputTokenCount', () => ({
  validateInputTokenCount: vi.fn(() => ({ success: true }))
}));

const mapPromptId = 'map-prompt';
const mapIterationPromptId = 'map-iteration-prompt';
const reducePromptId = 'reduce-prompt';

function mockGetPrompt(promptId: string): MapPrompt | ReducePrompt {
  if (promptId.includes('reduce')) {
    return {
      promptId,
      promptText: 'Test reduce prompt',
      operation: CondensationOperations.REDUCE,
      condensationType: CONDENSATION_TYPE.LikertPros,
      params: {
        coalescingPrompt: 'Test reduce prompt',
        coalescingPromptId: reducePromptId,
        denominator: 2
      }
    };
  }
  return {
    promptId,
    promptText: 'Test map prompt',
    operation: CondensationOperations.MAP,
    condensationType: CONDENSATION_TYPE.LikertPros,
    params: {
      condensationPrompt: 'Test map prompt',
      condensationPromptId: mapPromptId,
      batchSize: 30
    }
  };
}

function createMockComments(count: number): Array<VAAComment> {
  return Array.from({ length: count }, (_, i) => ({
    id: `comment-${i}`,
    entityId: `candidate-${i}`,
    entityAnswer: i % 2 === 0 ? 'true' : 'false',
    text: `Mock comment ${i + 1}`
  }));
}

describe('createCondensationSteps', () => {
  const language = 'en';
  const questionName = 'Test Question';
  const parallelFactor = 3;
  const modelTPMLimit = 30000;

  beforeEach(() => {
    vi.mocked(PromptRegistry.create).mockResolvedValue({
      getPrompt: mockGetPrompt
    } as unknown as PromptRegistry);
  });

  const testCases = [
    { totalComments: 1 },
    { totalComments: 10 },
    { totalComments: 119 },
    { totalComments: 200 },
    { totalComments: 555 },
    { totalComments: 888 },
    { totalComments: 1000 },
    { totalComments: 10000 } // Over the current limit but should still work
  ];

  for (const { totalComments } of testCases) {
    test(`It should create a valid plan for ${totalComments} comments`, async () => {
      const comments = createMockComments(totalComments);
      const steps = await createCondensationSteps({
        comments,
        mapPromptId,
        mapIterationPromptId,
        reducePromptId,
        language,
        questionName,
        parallelFactor,
        modelTPMLimit
      });

      expect(() => validatePlan({ steps, commentCount: totalComments })).not.toThrow();
    });
  }

  test('It should throw on empty comments array', async () => {
    const emptyComments: Array<VAAComment> = [];
    await expect(
      createCondensationSteps({
        comments: emptyComments,
        mapPromptId,
        mapIterationPromptId,
        reducePromptId,
        language,
        questionName,
        parallelFactor,
        modelTPMLimit
      })
    ).rejects.toThrow('There must be at least one comment to process.');
  });
});
