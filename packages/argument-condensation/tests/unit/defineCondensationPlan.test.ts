import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PromptRegistry } from '../../src/core/condensation/prompts/promptRegistry';
import { CONDENSATION_TYPE, CondensationOperations } from '../../src/core/types';
import { MapPrompt, ReducePrompt } from '../../src/core/types/llm/prompt';
import { createCondensationSteps } from '../../src/core/utils/condensation/defineCondensationSteps';
import { validatePlan } from '../../src/core/utils/condensation/planValidation';

vi.mock('../../src/core/condensation/prompts/promptRegistry');

const mapPromptId = 'map-prompt';
const mapIterationPromptId = 'map-iteration-prompt';
const reducePromptId = 'reduce-prompt';

function mockGetPrompt(promptId: string): MapPrompt | ReducePrompt {
  if (promptId.includes('reduce')) {
    return {
      promptId,
      promptText: 'Test reduce prompt',
      operation: CondensationOperations.REDUCE,
      condensationType: CONDENSATION_TYPE.LIKERT.PROS,
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
    condensationType: CONDENSATION_TYPE.LIKERT.PROS,
    params: {
      condensationPrompt: 'Test map prompt',
      condensationPromptId: mapPromptId,
      iterationPrompt: 'Test map iteration prompt',
      iterationPromptId: mapIterationPromptId,
      batchSize: 30
    }
  };
}

describe('createCondensationSteps', () => {
  const language = 'en';

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
    it(`should create a valid plan for ${totalComments} comments`, async () => {
      const steps = await createCondensationSteps({
        totalComments,
        mapPromptId,
        mapIterationPromptId,
        reducePromptId,
        language
      });

      expect(() => validatePlan({ steps, commentCount: totalComments })).not.toThrow();
    });
  }

  it('should throw an error for a negative number of comments', async () => {
    await expect(
      createCondensationSteps({
        totalComments: -1,
        mapPromptId,
        mapIterationPromptId,
        reducePromptId,
        language
      })
    ).rejects.toThrow('Total comments must be a non-negative number.');
  });
});
