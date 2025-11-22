import { describe, expect, test, vi } from 'vitest';
import { createCondensationSteps } from '../../src/core/utils/condensation/defineCondensationSteps';
import { validatePlan } from '../../src/core/utils/condensation/planValidation';
import type { VAAComment } from '../../src/core/types';

vi.mock('../../src/core/utils/condensation/validateInputTokenCount', () => ({
  validateInputTokenCount: vi.fn(() => ({ success: true }))
}));

const mapPromptId = 'map-prompt';
const mapIterationPromptId = 'map-iteration-prompt';
const reducePromptId = 'reduce-prompt';

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
