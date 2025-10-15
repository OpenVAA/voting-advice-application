import { beforeEach, describe, expect, it } from 'vitest';
import { analyzeDocument } from '../../src/core/documentAnalysis';
import { FakeLLMProvider } from '../helpers/fakeLLMProvider';

describe('analyzeDocument', () => {
  let fakeLLMProvider: FakeLLMProvider;
  const sampleText = 'Title: Sample Doc. Author: John Doe. This is the content.';
  const sampleSegments = ['This is segment one.', 'This is segment two.'];

  beforeEach(() => {
    fakeLLMProvider = new FakeLLMProvider();
  });

  it('should analyze a document correctly', async () => {
    const metadata = { title: 'Sample Doc', authors: ['John Doe'] };
    const summaries = ['Summary of segment one.', 'Summary of segment two.'];

    fakeLLMProvider.setGenerateObjectResponse({
      object: metadata,
      costs: { total: 0.01, input: 0.005, output: 0.005 },
      usage: { inputTokens: 25, outputTokens: 50, totalTokens: 75 }
    });

    fakeLLMProvider.setGenerateObjectParallelResponses(
      summaries.map((summary) => ({
        object: { summary },
        costs: { total: 0.015, input: 0.007, output: 0.008 },
        usage: { inputTokens: 30, outputTokens: 60, totalTokens: 90 }
      }))
    );

    const result = await analyzeDocument({
      text: sampleText,
      segments: sampleSegments,
      llmProvider: fakeLLMProvider,
      runId: 'test-run-id'
    });

    expect(result.data.sourceMetadata).toEqual(metadata);
    // Check that segment analyses have the expected structure
    expect(result.data.segmentAnalyses).toHaveLength(2);
    result.data.segmentAnalyses.forEach((analysis, index) => {
      expect(analysis).toMatchObject({
        segment: sampleSegments[index],
        segmentIndex: index,
        summary: summaries[index],
        standaloneFacts: []
      });
      expect(analysis.id).toBeDefined();
      expect(analysis.parentDocId).toBeDefined();
    });
    expect(result.llmMetrics.costs.total).toBeCloseTo(0.01 + 2 * 0.015);
    expect(result.llmMetrics.tokens.totalTokens).toBe(75 + 2 * 90);
  });
});
