import { describe, it, expect, beforeEach, vi } from 'vitest';
import { analyzeDocument } from '../../src/core/documentAnalysis';
import { createFakeLLMProvider, createFakeModelConfig } from '../helpers/fakeLLMProvider';
import { MEDIUM_TEXT, TEXT_WITH_METADATA } from '../fixtures/sampleTexts';

describe('analyzeDocument', () => {
  let fakeLLMProvider: ReturnType<typeof createFakeLLMProvider>;
  let modelConfig: ReturnType<typeof createFakeModelConfig>;

  beforeEach(() => {
    fakeLLMProvider = createFakeLLMProvider();
    modelConfig = createFakeModelConfig();
  });

  describe('metadata extraction', () => {
    it('should extract metadata from document', async () => {
      // Configure metadata extraction response
      fakeLLMProvider.addResponse('Beginning of document:', {
        object: {
          title: 'Test Document',
          source: 'Test Source',
          authors: ['Author 1', 'Author 2'],
          publishedDate: '2024-01-01',
          locale: 'en'
        }
      });

      // Configure segment analysis response
      fakeLLMProvider.addResponse('PORTION TO ANALYZE', {
        object: {
          summary: 'Test summary',
          standaloneFacts: ['Fact 1']
        }
      });

      const result = await analyzeDocument({
        fullText: TEXT_WITH_METADATA,
        segments: ['Segment 1'],
        llmProvider: fakeLLMProvider as any,
        modelConfig
      });

      expect(result.metadata.title).toBe('Test Document');
      expect(result.metadata.source).toBe('Test Source');
      expect(result.metadata.authors).toEqual(['Author 1', 'Author 2']);
      expect(result.metadata.publishedDate).toBe('2024-01-01');
      expect(result.metadata.locale).toBe('en');
    });

    it('should handle partial metadata', async () => {
      fakeLLMProvider.addResponse('Beginning of document:', {
        object: {
          title: 'Partial Metadata Doc'
          // No other fields
        }
      });

      fakeLLMProvider.addResponse('PORTION TO ANALYZE', {
        object: {
          summary: 'Summary'
        }
      });

      const result = await analyzeDocument({
        fullText: MEDIUM_TEXT,
        segments: ['Segment'],
        llmProvider: fakeLLMProvider as any,
        modelConfig
      });

      expect(result.metadata.title).toBe('Partial Metadata Doc');
      expect(result.metadata.source).toBeUndefined();
      expect(result.metadata.authors).toBeUndefined();
    });

    it('should use first and last 500 characters for metadata extraction', async () => {
      fakeLLMProvider.addResponse('Beginning of document:', {
        object: { title: 'Test' }
      });

      fakeLLMProvider.addResponse('PORTION TO ANALYZE', {
        object: { summary: 'Summary' }
      });

      const longText = 'START' + 'x'.repeat(2000) + 'END';
      await analyzeDocument({
        fullText: longText,
        segments: ['Segment'],
        llmProvider: fakeLLMProvider as any,
        modelConfig
      });

      const callHistory = fakeLLMProvider.getCallHistory();
      const metadataCall = callHistory.find((call) => {
        const content = call.messages?.[0]?.content as string;
        return content?.includes('Beginning of document:');
      });

      const promptContent = metadataCall?.messages?.[0]?.content as string;
      expect(promptContent).toContain('START');
      expect(promptContent).toContain('END');
    });
  });

  describe('segment analysis', () => {
    it('should analyze all segments', async () => {
      fakeLLMProvider.addResponse('Beginning of document:', {
        object: {}
      });

      fakeLLMProvider.addResponse('PORTION TO ANALYZE', {
        object: {
          summary: 'Segment summary',
          standaloneFacts: ['Fact 1', 'Fact 2']
        }
      });

      const segments = ['Segment 1', 'Segment 2', 'Segment 3'];
      const result = await analyzeDocument({
        fullText: MEDIUM_TEXT,
        segments,
        llmProvider: fakeLLMProvider as any,
        modelConfig
      });

      expect(result.segmentAnalyses).toHaveLength(3);
      expect(result.processingMetadata.segmentsAnalyzed).toBe(3);
      expect(result.processingMetadata.summariesGenerated).toBe(3);
    });

    it('should include segment context in prompts', async () => {
      fakeLLMProvider.addResponse('Beginning of document:', {
        object: {}
      });

      fakeLLMProvider.addResponse('PORTION TO ANALYZE', {
        object: { summary: 'Summary' }
      });

      const segments = ['First segment', 'Middle segment', 'Last segment'];
      await analyzeDocument({
        fullText: MEDIUM_TEXT,
        segments,
        llmProvider: fakeLLMProvider as any,
        modelConfig
      });

      const callHistory = fakeLLMProvider.getCallHistory();
      const segmentCalls = callHistory.filter((call) => {
        const content = call.messages?.[0]?.content as string;
        return content?.includes('PORTION TO ANALYZE');
      });

      expect(segmentCalls).toHaveLength(3);
    });

    it('should handle segments with no standalone facts', async () => {
      fakeLLMProvider.addResponse('Beginning of document:', {
        object: {}
      });

      fakeLLMProvider.addResponse('PORTION TO ANALYZE', {
        object: {
          summary: 'Summary with no facts'
          // No standaloneFacts field
        }
      });

      const result = await analyzeDocument({
        fullText: MEDIUM_TEXT,
        segments: ['Segment'],
        llmProvider: fakeLLMProvider as any,
        modelConfig
      });

      expect(result.segmentAnalyses[0].standaloneFacts).toEqual([]);
    });

    it('should add parentDocId to each segment analysis', async () => {
      fakeLLMProvider.addResponse('Beginning of document:', {
        object: {}
      });

      fakeLLMProvider.addResponse('PORTION TO ANALYZE', {
        object: { summary: 'Summary' }
      });

      const customDocId = 'custom-doc-123';
      const result = await analyzeDocument({
        fullText: MEDIUM_TEXT,
        segments: ['Seg 1', 'Seg 2'],
        llmProvider: fakeLLMProvider as any,
        modelConfig,
        documentId: customDocId
      });

      expect(result.segmentAnalyses[0].parentDocId).toBe(customDocId);
      expect(result.segmentAnalyses[1].parentDocId).toBe(customDocId);
    });

    it('should assign correct segment indices', async () => {
      fakeLLMProvider.addResponse('Beginning of document:', {
        object: {}
      });

      fakeLLMProvider.addResponse('PORTION TO ANALYZE', {
        object: { summary: 'Summary' }
      });

      const result = await analyzeDocument({
        fullText: MEDIUM_TEXT,
        segments: ['Seg 1', 'Seg 2', 'Seg 3'],
        llmProvider: fakeLLMProvider as any,
        modelConfig
      });

      expect(result.segmentAnalyses[0].segmentIndex).toBe(0);
      expect(result.segmentAnalyses[1].segmentIndex).toBe(1);
      expect(result.segmentAnalyses[2].segmentIndex).toBe(2);
    });

    it('should generate unique IDs for each segment', async () => {
      fakeLLMProvider.addResponse('Beginning of document:', {
        object: {}
      });

      fakeLLMProvider.addResponse('PORTION TO ANALYZE', {
        object: { summary: 'Summary' }
      });

      const result = await analyzeDocument({
        fullText: MEDIUM_TEXT,
        segments: ['Seg 1', 'Seg 2'],
        llmProvider: fakeLLMProvider as any,
        modelConfig
      });

      const ids = result.segmentAnalyses.map((s) => s.id);
      expect(new Set(ids).size).toBe(2); // All IDs should be unique
    });
  });

  describe('context window creation', () => {
    it('should add following context for first segment', async () => {
      fakeLLMProvider.addResponse('Beginning of document:', {
        object: {}
      });

      fakeLLMProvider.addResponse('PORTION TO ANALYZE', {
        object: { summary: 'Summary' }
      });

      const segments = ['First'.repeat(100), 'Second'.repeat(100), 'Third'.repeat(100)];
      await analyzeDocument({
        fullText: MEDIUM_TEXT,
        segments,
        llmProvider: fakeLLMProvider as any,
        modelConfig
      });

      const callHistory = fakeLLMProvider.getCallHistory();
      const firstSegmentCall = callHistory.find((call) => {
        const content = call.messages?.[0]?.content as string;
        return content?.includes('FOLLOWING CONTEXT');
      });

      expect(firstSegmentCall).toBeDefined();
    });

    it('should add preceding context for last segment', async () => {
      fakeLLMProvider.addResponse('Beginning of document:', {
        object: {}
      });

      fakeLLMProvider.addResponse('PORTION TO ANALYZE', {
        object: { summary: 'Summary' }
      });

      const segments = ['First'.repeat(100), 'Second'.repeat(100), 'Last'.repeat(100)];
      await analyzeDocument({
        fullText: MEDIUM_TEXT,
        segments,
        llmProvider: fakeLLMProvider as any,
        modelConfig
      });

      const callHistory = fakeLLMProvider.getCallHistory();
      const lastSegmentCall = callHistory
        .filter((call) => {
          const content = call.messages?.[0]?.content as string;
          return content?.includes('PRECEDING CONTEXT');
        })
        .pop();

      expect(lastSegmentCall).toBeDefined();
    });

    it('should add both preceding and following context for middle segments', async () => {
      fakeLLMProvider.addResponse('Beginning of document:', {
        object: {}
      });

      fakeLLMProvider.addResponse('PORTION TO ANALYZE', {
        object: { summary: 'Summary' }
      });

      const segments = ['First'.repeat(100), 'Middle'.repeat(100), 'Last'.repeat(100)];
      await analyzeDocument({
        fullText: MEDIUM_TEXT,
        segments,
        llmProvider: fakeLLMProvider as any,
        modelConfig
      });

      const callHistory = fakeLLMProvider.getCallHistory();
      const middleSegmentCall = callHistory.filter((call) => {
        const content = call.messages?.[0]?.content as string;
        return (
          content?.includes('PORTION TO ANALYZE') &&
          content?.includes('PRECEDING CONTEXT') &&
          content?.includes('FOLLOWING CONTEXT')
        );
      })[0];

      expect(middleSegmentCall).toBeDefined();
    });
  });

  describe('document ID handling', () => {
    it('should use provided document ID', async () => {
      fakeLLMProvider.addResponse('Beginning of document:', {
        object: {}
      });

      fakeLLMProvider.addResponse('PORTION TO ANALYZE', {
        object: { summary: 'Summary' }
      });

      const customId = 'my-custom-doc-id';
      const result = await analyzeDocument({
        fullText: MEDIUM_TEXT,
        segments: ['Segment'],
        llmProvider: fakeLLMProvider as any,
        modelConfig,
        documentId: customId
      });

      expect(result.documentId).toBe(customId);
    });

    it('should generate UUID when no document ID provided', async () => {
      fakeLLMProvider.addResponse('Beginning of document:', {
        object: {}
      });

      fakeLLMProvider.addResponse('PORTION TO ANALYZE', {
        object: { summary: 'Summary' }
      });

      const result = await analyzeDocument({
        fullText: MEDIUM_TEXT,
        segments: ['Segment'],
        llmProvider: fakeLLMProvider as any,
        modelConfig
      });

      // UUID format check
      expect(result.documentId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });
  });

  describe('cost and performance tracking', () => {
    it('should calculate total costs from all LLM calls', async () => {
      fakeLLMProvider.addResponse('Beginning of document:', {
        object: {},
        costs: { input: 0.001, output: 0.001, total: 0.002 }
      });

      fakeLLMProvider.addResponse('PORTION TO ANALYZE', {
        object: { summary: 'Summary' },
        costs: { input: 0.002, output: 0.002, total: 0.004 }
      });

      const result = await analyzeDocument({
        fullText: MEDIUM_TEXT,
        segments: ['Seg1', 'Seg2', 'Seg3'],
        llmProvider: fakeLLMProvider as any,
        modelConfig
      });

      // 1 metadata call (0.002) + 3 segment calls (3 * 0.004) = 0.014
      expect(result.processingMetadata.costs.total).toBe(0.014);
      expect(result.processingMetadata.costs.currency).toBe('USD');
    });

    it('should calculate per-segment average cost', async () => {
      fakeLLMProvider.addResponse('Beginning of document:', {
        object: {},
        costs: { input: 0.001, output: 0.001, total: 0.002 }
      });

      fakeLLMProvider.addResponse('PORTION TO ANALYZE', {
        object: { summary: 'Summary' },
        costs: { input: 0.003, output: 0.003, total: 0.006 }
      });

      const result = await analyzeDocument({
        fullText: MEDIUM_TEXT,
        segments: ['Seg1', 'Seg2'],
        llmProvider: fakeLLMProvider as any,
        modelConfig
      });

      // Total: 0.002 + 2*0.006 = 0.014, per segment average: 0.014/2 = 0.007
      expect(result.processingMetadata.costs.perSegmentAverage).toBe(0.007);
    });

    it('should track processing time', async () => {
      fakeLLMProvider.addResponse('Beginning of document:', {
        object: {}
      });

      fakeLLMProvider.addResponse('PORTION TO ANALYZE', {
        object: { summary: 'Summary' }
      });

      const result = await analyzeDocument({
        fullText: MEDIUM_TEXT,
        segments: ['Segment'],
        llmProvider: fakeLLMProvider as any,
        modelConfig
      });

      expect(result.processingMetadata.processingTimeMs).toBeGreaterThan(0);
    });

    it('should count facts extracted', async () => {
      fakeLLMProvider.addResponse('Beginning of document:', {
        object: {}
      });

      fakeLLMProvider.addResponse('PORTION TO ANALYZE', {
        object: {
          summary: 'Summary',
          standaloneFacts: ['Fact 1', 'Fact 2', 'Fact 3']
        }
      });

      const result = await analyzeDocument({
        fullText: MEDIUM_TEXT,
        segments: ['Seg1', 'Seg2'],
        llmProvider: fakeLLMProvider as any,
        modelConfig
      });

      // 2 segments * 3 facts each = 6 facts
      expect(result.processingMetadata.factsExtracted).toBe(6);
    });
  });

  describe('parallel processing', () => {
    it('should analyze segments in parallel', async () => {
      fakeLLMProvider.addResponse('Beginning of document:', {
        object: {}
      });

      fakeLLMProvider.addResponse('PORTION TO ANALYZE', {
        object: { summary: 'Summary' }
      });

      const segments = Array.from({ length: 10 }, (_, i) => `Segment ${i}`);
      await analyzeDocument({
        fullText: MEDIUM_TEXT,
        segments,
        llmProvider: fakeLLMProvider as any,
        modelConfig
      });

      const callHistory = fakeLLMProvider.getCallHistory();
      const segmentCalls = callHistory.filter((call) => {
        const content = call.messages?.[0]?.content as string;
        return content?.includes('PORTION TO ANALYZE');
      });

      expect(segmentCalls).toHaveLength(10);
    });
  });

  describe('error handling', () => {
    it('should handle metadata extraction errors', async () => {
      const errorProvider = {
        generateObject: async () => {
          throw new Error('Metadata extraction failed');
        },
        generateObjectParallel: async () => []
      };

      await expect(
        analyzeDocument({
          fullText: MEDIUM_TEXT,
          segments: ['Segment'],
          llmProvider: errorProvider as any,
          modelConfig
        })
      ).rejects.toThrow('Metadata extraction failed');
    });

    it('should handle segment analysis errors', async () => {
      let callCount = 0;
      const errorProvider = {
        generateObject: async () => {
          callCount++;
          if (callCount === 1) {
            // First call (metadata) succeeds
            return {
              object: {},
              finishReason: 'stop',
              usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
              latencyMs: 100,
              attempts: 1,
              costs: { input: 0.001, output: 0.001, total: 0.002 },
              model: 'test',
              fallbackUsed: false,
              warnings: undefined,
              request: { body: '' },
              response: { id: 'test', timestamp: new Date(), modelId: 'test' },
              rawResponse: { headers: {} }
            };
          }
          throw new Error('Segment analysis failed');
        },
        generateObjectParallel: async () => {
          throw new Error('Segment analysis failed');
        }
      };

      await expect(
        analyzeDocument({
          fullText: MEDIUM_TEXT,
          segments: ['Segment'],
          llmProvider: errorProvider as any,
          modelConfig
        })
      ).rejects.toThrow('Segment analysis failed');
    });
  });

  describe('schema and settings', () => {
    it('should use correct temperature', async () => {
      fakeLLMProvider.addResponse('Beginning of document:', {
        object: {}
      });

      fakeLLMProvider.addResponse('PORTION TO ANALYZE', {
        object: { summary: 'Summary' }
      });

      await analyzeDocument({
        fullText: MEDIUM_TEXT,
        segments: ['Segment'],
        llmProvider: fakeLLMProvider as any,
        modelConfig
      });

      const callHistory = fakeLLMProvider.getCallHistory();
      expect(callHistory.every((call) => call.temperature === 0.7)).toBe(true);
    });

    it('should configure retry settings', async () => {
      fakeLLMProvider.addResponse('Beginning of document:', {
        object: {}
      });

      fakeLLMProvider.addResponse('PORTION TO ANALYZE', {
        object: { summary: 'Summary' }
      });

      await analyzeDocument({
        fullText: MEDIUM_TEXT,
        segments: ['Segment'],
        llmProvider: fakeLLMProvider as any,
        modelConfig
      });

      const callHistory = fakeLLMProvider.getCallHistory();
      expect(callHistory.every((call) => call.maxRetries === 3)).toBe(true);
      expect(callHistory.every((call) => call.validationRetries === 3)).toBe(true);
    });
  });
});
