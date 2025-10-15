import { beforeEach, describe, expect, it } from 'vitest';
import { segmentText } from '../../src/core/textSegmentation';
import { FakeLLMProvider } from '../helpers/fakeLLMProvider';
import type { LLMProvider } from '@openvaa/llm-refactor';

describe('segmentText', () => {
  let fakeLLMProvider: FakeLLMProvider;
  const sampleText = 'This is a sample text for testing purposes. It has multiple sentences.';

  beforeEach(() => {
    fakeLLMProvider = new FakeLLMProvider();
  });

  it('should segment text correctly', async () => {
    const segments = ['This is a sample text.', 'It has multiple sentences.'];
    fakeLLMProvider.setGenerateObjectParallelResponses([
      {
        object: { segments },
        costs: { total: 0.02, input: 0.01, output: 0.01 },
        usage: { inputTokens: 200, outputTokens: 400, totalTokens: 600 }
      }
    ]);

    const result = await segmentText({
      text: sampleText,
      llmProvider: fakeLLMProvider as unknown as LLMProvider,
      runId: 'test-run-id'
    });

    expect(result.data.segments).toEqual(segments);
    expect(result.llmMetrics.costs.total).toBe(0.02);
    expect(result.llmMetrics.tokens.totalTokens).toBe(600);
  });

  it('should throw an error if segmentation result is invalid', async () => {
    fakeLLMProvider.setGenerateObjectParallelResponses([
      {
        object: { segments: 'invalid' } // Invalid format - should fail schema validation
      }
    ]);

    await expect(
      segmentText({
        text: sampleText,
        llmProvider: fakeLLMProvider as unknown as LLMProvider,
        runId: 'test-run-id'
      })
    ).rejects.toThrow();
  });

  // TODO: should it though?
  it('should handle empty text', async () => {
    fakeLLMProvider.setGenerateObjectParallelResponses([
      {
        object: { segments: [] }
      }
    ]);

    const result = await segmentText({
      text: '',
      llmProvider: fakeLLMProvider as unknown as LLMProvider,
      runId: 'test-run-id'
    });
    expect(result.data.segments).toEqual([]);
  });
});
