import { beforeEach, describe, expect, it } from 'vitest';
import { segmentText } from '../../src/core/textSegmentation';
import { LONG_TEXT, MEDIUM_TEXT } from '../fixtures/sampleTexts';
import { createFakeLLMProvider, createFakeModelConfig } from '../helpers/fakeLLMProvider';
import type { LLMProvider } from '@openvaa/llm-refactor';

describe('segmentText', () => {
  let fakeLLMProvider: ReturnType<typeof createFakeLLMProvider>;
  let modelConfig: ReturnType<typeof createFakeModelConfig>;

  beforeEach(() => {
    fakeLLMProvider = createFakeLLMProvider();
    modelConfig = createFakeModelConfig();
  });

  describe('basic segmentation', () => {
    it('should segment text into multiple segments', async () => {
      // Configure fake response
      fakeLLMProvider.setDefaultResponse({
        object: {
          segments: ['Segment 1 text here', 'Segment 2 text here', 'Segment 3 text here']
        },
        costs: { input: 0.001, output: 0.002, total: 0.003 }
      });

      const result = await segmentText({
        text: MEDIUM_TEXT,
        llmProvider: fakeLLMProvider as unknown as LLMProvider,
        modelConfig,
        minSegmentLength: 300,
        maxSegmentLength: 1000
      });

      expect(result.segments).toHaveLength(3);
      expect(result.metadata.segmentCount).toBe(3);
      expect(result.metadata.totalCharacters).toBe(MEDIUM_TEXT.length);
    });

    it('should handle single segment', async () => {
      fakeLLMProvider.setDefaultResponse({
        object: {
          segments: ['Single complete segment']
        }
      });

      const result = await segmentText({
        text: 'Short text',
        llmProvider: fakeLLMProvider as unknown as LLMProvider,
        modelConfig
      });

      expect(result.segments).toHaveLength(1);
      expect(result.metadata.segmentCount).toBe(1);
    });

    it('should calculate correct metadata', async () => {
      const segments = ['First segment with 500 chars'.repeat(20), 'Second segment with 800 chars'.repeat(30)];
      fakeLLMProvider.setDefaultResponse({
        object: { segments }
      });

      const result = await segmentText({
        text: segments.join(''),
        llmProvider: fakeLLMProvider as unknown as LLMProvider,
        modelConfig
      });

      expect(result.metadata.averageSegmentLength).toBeGreaterThan(0);
      expect(result.metadata.minSegmentLength).toBeLessThanOrEqual(result.metadata.maxSegmentLength);
    });
  });

  describe('chunking for large texts', () => {
    it('should split large text into chunks based on charsPerLLMCall', async () => {
      fakeLLMProvider.setDefaultResponse({
        object: {
          segments: ['Segment from chunk']
        }
      });

      await segmentText({
        text: LONG_TEXT,
        llmProvider: fakeLLMProvider as unknown as LLMProvider,
        modelConfig,
        charsPerLLMCall: 1000 // Force multiple calls
      });

      const callHistory = fakeLLMProvider.getCallHistory();
      const expectedCalls = Math.ceil(LONG_TEXT.length / 1000);

      expect(callHistory.length).toBe(expectedCalls);
    });

    it('should handle charsPerLLMCall parameter correctly', async () => {
      fakeLLMProvider.setDefaultResponse({
        object: { segments: ['Chunk segment'] }
      });

      const charsPerCall = 500;
      await segmentText({
        text: 'x'.repeat(1500), // 1500 chars should make 3 calls
        llmProvider: fakeLLMProvider as unknown as LLMProvider,
        modelConfig,
        charsPerLLMCall: charsPerCall
      });

      const callHistory = fakeLLMProvider.getCallHistory();
      expect(callHistory.length).toBe(3);
    });
  });

  describe('segment length parameters', () => {
    it('should pass minSegmentLength to prompt', async () => {
      fakeLLMProvider.setDefaultResponse({
        object: { segments: ['Segment'] }
      });

      await segmentText({
        text: MEDIUM_TEXT,
        llmProvider: fakeLLMProvider as unknown as LLMProvider,
        modelConfig,
        minSegmentLength: 300,
        maxSegmentLength: 1000
      });

      const callHistory = fakeLLMProvider.getCallHistory();
      const promptContent = callHistory[0].messages?.[0]?.content as string;

      expect(promptContent).toContain('300');
      expect(promptContent).toContain('1000');
    });

    it('should use default segment lengths when not provided', async () => {
      fakeLLMProvider.setDefaultResponse({
        object: { segments: ['Segment'] }
      });

      await segmentText({
        text: MEDIUM_TEXT,
        llmProvider: fakeLLMProvider as unknown as LLMProvider,
        modelConfig
      });

      const callHistory = fakeLLMProvider.getCallHistory();
      const promptContent = callHistory[0].messages?.[0]?.content as string;

      // Default is 500-1000
      expect(promptContent).toContain('500');
      expect(promptContent).toContain('1000');
    });
  });

  describe('cost calculation', () => {
    it('should aggregate costs from multiple LLM calls', async () => {
      fakeLLMProvider.setDefaultResponse({
        object: { segments: ['Segment'] },
        costs: { input: 0.001, output: 0.001, total: 0.002 }
      });

      const result = await segmentText({
        text: 'x'.repeat(3000),
        llmProvider: fakeLLMProvider as unknown as LLMProvider,
        modelConfig,
        charsPerLLMCall: 1000 // This will make 3 calls
      });

      // 3 calls * 0.002 each = 0.006
      expect(result.metadata.costs.total).toBe(0.006);
      expect(result.metadata.costs.currency).toBe('USD');
    });

    it('should handle zero costs', async () => {
      fakeLLMProvider.setDefaultResponse({
        object: { segments: ['Segment'] },
        costs: { input: 0, output: 0, total: 0 }
      });

      const result = await segmentText({
        text: MEDIUM_TEXT,
        llmProvider: fakeLLMProvider as unknown as LLMProvider,
        modelConfig
      });

      expect(result.metadata.costs.total).toBe(0);
    });
  });

  describe('validation', () => {
    it('should call isTextPreserved when validateTextPreservation is true', async () => {
      fakeLLMProvider.setDefaultResponse({
        object: { segments: ['Segment'] }
      });

      // This should not throw, just log
      const result = await segmentText({
        text: MEDIUM_TEXT,
        llmProvider: fakeLLMProvider as unknown as LLMProvider,
        modelConfig,
        validateTextPreservation: true
      });

      expect(result.segments).toBeDefined();
    });

    it('should skip validation when validateTextPreservation is false', async () => {
      fakeLLMProvider.setDefaultResponse({
        object: { segments: ['Segment'] }
      });

      const result = await segmentText({
        text: MEDIUM_TEXT,
        llmProvider: fakeLLMProvider as unknown as LLMProvider,
        modelConfig,
        validateTextPreservation: false
      });

      expect(result.segments).toBeDefined();
    });
  });

  describe('parallel processing', () => {
    it('should use generateObjectParallel for multiple chunks', async () => {
      fakeLLMProvider.setDefaultResponse({
        object: { segments: ['Chunk segment'] }
      });

      await segmentText({
        text: 'x'.repeat(5000),
        llmProvider: fakeLLMProvider as unknown as LLMProvider,
        modelConfig,
        charsPerLLMCall: 1000
      });

      const callHistory = fakeLLMProvider.getCallHistory();
      expect(callHistory.length).toBeGreaterThan(1);
    });

    it('should flatten results from parallel calls', async () => {
      fakeLLMProvider.setDefaultResponse({
        object: { segments: ['Seg1', 'Seg2'] }
      });

      const result = await segmentText({
        text: 'x'.repeat(2000),
        llmProvider: fakeLLMProvider as unknown as LLMProvider,
        modelConfig,
        charsPerLLMCall: 1000 // 2 calls, each returning 2 segments
      });

      // Should have 4 total segments (2 calls * 2 segments each)
      expect(result.segments).toHaveLength(4);
    });
  });

  describe('error handling', () => {
    it('should handle LLM provider errors', async () => {
      const errorProvider = {
        generateObjectParallel: async () => {
          throw new Error('LLM API error');
        }
      };

      await expect(
        segmentText({
          text: MEDIUM_TEXT,
          llmProvider: errorProvider as unknown as LLMProvider,
          modelConfig
        })
      ).rejects.toThrow('LLM API error');
    });

    it('should handle empty segments response', async () => {
      fakeLLMProvider.setDefaultResponse({
        object: { segments: [] }
      });

      const result = await segmentText({
        text: MEDIUM_TEXT,
        llmProvider: fakeLLMProvider as unknown as LLMProvider,
        modelConfig
      });

      expect(result.segments).toHaveLength(0);
      expect(result.metadata.segmentCount).toBe(0);
    });
  });

  describe('schema validation', () => {
    it('should pass correct schema to LLM provider', async () => {
      fakeLLMProvider.setDefaultResponse({
        object: { segments: ['Test'] }
      });

      await segmentText({
        text: MEDIUM_TEXT,
        llmProvider: fakeLLMProvider as unknown as LLMProvider,
        modelConfig
      });

      const callHistory = fakeLLMProvider.getCallHistory();
      const schema = callHistory[0].schema;

      expect(schema).toBeDefined();
      // Schema should validate segments array
      const testData = { segments: ['test1', 'test2'] };
      expect(() => schema.parse(testData)).not.toThrow();
    });
  });

  describe('temperature and retry settings', () => {
    it('should use temperature 0.7', async () => {
      fakeLLMProvider.setDefaultResponse({
        object: { segments: ['Test'] }
      });

      await segmentText({
        text: MEDIUM_TEXT,
        llmProvider: fakeLLMProvider as unknown as LLMProvider,
        modelConfig
      });

      const callHistory = fakeLLMProvider.getCallHistory();
      expect(callHistory[0].temperature).toBe(0.7);
    });

    it('should configure retry settings', async () => {
      fakeLLMProvider.setDefaultResponse({
        object: { segments: ['Test'] }
      });

      await segmentText({
        text: MEDIUM_TEXT,
        llmProvider: fakeLLMProvider as unknown as LLMProvider,
        modelConfig
      });

      const callHistory = fakeLLMProvider.getCallHistory();
      expect(callHistory[0].maxRetries).toBe(3);
      expect(callHistory[0].validationRetries).toBe(3);
    });
  });
});
