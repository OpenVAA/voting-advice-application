import { promises as fs } from 'fs';
import path from 'path';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { FakeLLMProvider } from './helpers/fakeLLMProvider';
import { processPdf, processText } from '../src/api';

describe('File Processing API', () => {
  let fakeLLMProvider: FakeLLMProvider;
  let pdfBuffer: Buffer;
  const sampleText = 'This is a sample text for testing the API.';

  beforeAll(async () => {
    const pdfPath = path.resolve(
      __dirname,
      '../../../packages/vector-store/src/docs/storage/official/how-eu-works.pdf'
    );
    pdfBuffer = await fs.readFile(pdfPath);
  });

  beforeEach(() => {
    fakeLLMProvider = new FakeLLMProvider();
  });

  describe('processText', () => {
    it('should process text by segmenting and analyzing it', async () => {
      const segments = ['This is a sample text.'];

      // Mock segmentation (first parallel call)
      fakeLLMProvider.setGenerateObjectParallelResponses([
        {
          object: { segments },
          costs: { total: 0.01, input: 0.005, output: 0.005 },
          usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 }
        }
      ]);

      // Mock metadata extraction (single call)
      const metadata = { title: 'Sample Text' };
      fakeLLMProvider.setGenerateObjectResponse({
        object: metadata,
        costs: { total: 0.02, input: 0.01, output: 0.01 },
        usage: { inputTokens: 20, outputTokens: 10, totalTokens: 30 }
      });

      // Mock segment analysis (second parallel call)
      fakeLLMProvider.setGenerateObjectParallelResponses([
        {
          object: { summary: 'A summary of the text.' },
          costs: { total: 0.03, input: 0.015, output: 0.015 },
          usage: { inputTokens: 30, outputTokens: 15, totalTokens: 45 }
        }
      ]);

      const result = await processText({
        text: sampleText,
        llmProvider: fakeLLMProvider,
        runId: 'test-run-id'
      });

      // Test the actual return structure
      expect(result.data.metadata).toEqual(metadata);
      expect(result.data.segmentAnalyses).toHaveLength(1);
      expect(result.data.segmentAnalyses[0]).toMatchObject({
        summary: 'A summary of the text.',
        segment: segments[0]
      });
    });
  });

  describe('processPdf', () => {
    it('should process a PDF by converting, segmenting, and analyzing', async () => {
      // Mock PDF conversion (streamText call)
      const markdownContent = '## PDF Content';
      fakeLLMProvider.setStreamTextResponse({
        text: Promise.resolve(markdownContent)
      });

      const segments = ['PDF Content'];

      // Mock segmentation (first parallel call)
      fakeLLMProvider.setGenerateObjectParallelResponses([
        {
          object: { segments }
        }
      ]);

      // Mock metadata extraction (single call)
      const metadata = { title: 'PDF Document' };
      fakeLLMProvider.setGenerateObjectResponse({
        object: metadata
      });

      // Mock segment analysis (second parallel call)
      fakeLLMProvider.setGenerateObjectParallelResponses([
        {
          object: { summary: 'Summary of PDF content.' }
        }
      ]);

      const result = await processPdf({
        pdfBuffer,
        llmProvider: fakeLLMProvider,
        runId: 'test-run-id',
      });

      // Test the actual return structure
      expect(result.data.extractedText).toBe(markdownContent);
      expect(result.data.metadata).toEqual(metadata);
      expect(result.data.segmentAnalyses).toHaveLength(1);
      expect(result.data.segmentAnalyses[0]).toMatchObject({
        summary: 'Summary of PDF content.',
        segment: segments[0]
      });
    });
  });
});
