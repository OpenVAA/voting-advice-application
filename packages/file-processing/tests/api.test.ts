import { beforeEach, describe, expect, it } from 'vitest';
import { LONG_TEXT, MEDIUM_TEXT } from './fixtures/sampleTexts';
import { createFakeLLMProvider, createFakeModelConfig } from './helpers/fakeLLMProvider';
import { processDocument } from '../src/api';

describe('processDocument', () => {
  let fakeLLMProvider: ReturnType<typeof createFakeLLMProvider>;
  let modelConfig: ReturnType<typeof createFakeModelConfig>;

  beforeEach(() => {
    fakeLLMProvider = createFakeLLMProvider();
    modelConfig = createFakeModelConfig();
  });

  describe('end-to-end processing', () => {
    it('should segment and analyze document', async () => {
      // Configure segmentation response
      fakeLLMProvider.addResponse('TEXT TO SEGMENT', {
        object: {
          segments: ['Segment 1', 'Segment 2', 'Segment 3']
        },
        costs: { input: 0.001, output: 0.001, total: 0.002 }
      });

      // Configure metadata extraction response
      fakeLLMProvider.addResponse('Beginning of document:', {
        object: {
          title: 'Test Document',
          source: 'Test Source'
        },
        costs: { input: 0.001, output: 0.001, total: 0.002 }
      });

      // Configure segment analysis response
      fakeLLMProvider.addResponse('PORTION TO ANALYZE', {
        object: {
          summary: 'Segment summary',
          standaloneFacts: ['Fact 1', 'Fact 2']
        },
        costs: { input: 0.002, output: 0.002, total: 0.004 }
      });

      const result = await processDocument({
        text: MEDIUM_TEXT,
        llmProvider: fakeLLMProvider as any,
        modelConfig
      });

      expect(result.documentId).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.segmentAnalyses).toHaveLength(3);
      expect(result.processingMetadata).toBeDefined();
    });

    it('should combine costs from segmentation and analysis', async () => {
      // Segmentation cost
      fakeLLMProvider.addResponse('TEXT TO SEGMENT', {
        object: { segments: ['Segment 1'] },
        costs: { input: 0.001, output: 0.001, total: 0.002 }
      });

      // Metadata extraction cost
      fakeLLMProvider.addResponse('Beginning of document:', {
        object: {},
        costs: { input: 0.001, output: 0.001, total: 0.002 }
      });

      // Segment analysis cost
      fakeLLMProvider.addResponse('PORTION TO ANALYZE', {
        object: { summary: 'Summary' },
        costs: { input: 0.003, output: 0.003, total: 0.006 }
      });

      const result = await processDocument({
        text: MEDIUM_TEXT,
        llmProvider: fakeLLMProvider as any,
        modelConfig
      });

      // Total: segmentation (0.002) + metadata (0.002) + analysis (0.006) = 0.010
      expect(result.processingMetadata.costs.total).toBe(0.01);
    });

    it('should pass through segment analyses from documentAnalysis', async () => {
      fakeLLMProvider.addResponse('TEXT TO SEGMENT', {
        object: { segments: ['Seg1', 'Seg2'] }
      });

      fakeLLMProvider.addResponse('Beginning of document:', {
        object: { title: 'Doc' }
      });

      fakeLLMProvider.addResponse('PORTION TO ANALYZE', {
        object: {
          summary: 'Test summary',
          standaloneFacts: ['Test fact']
        }
      });

      const result = await processDocument({
        text: MEDIUM_TEXT,
        llmProvider: fakeLLMProvider as any,
        modelConfig
      });

      expect(result.segmentAnalyses).toHaveLength(2);
      expect(result.segmentAnalyses[0].summary).toBe('Test summary');
      expect(result.segmentAnalyses[0].standaloneFacts).toContain('Test fact');
    });
  });

  describe('parameter passing', () => {
    it('should pass minSegmentLength to segmentation', async () => {
      fakeLLMProvider.setDefaultResponse({
        object: { segments: ['Segment'] }
      });

      await processDocument({
        text: MEDIUM_TEXT,
        llmProvider: fakeLLMProvider as any,
        modelConfig,
        minSegmentLength: 200
      });

      const callHistory = fakeLLMProvider.getCallHistory();
      const segmentationCall = callHistory.find((call) => {
        const content = call.messages?.[0]?.content as string;
        return content?.includes('TEXT TO SEGMENT');
      });

      const promptContent = segmentationCall?.messages?.[0]?.content as string;
      expect(promptContent).toContain('200');
    });

    it('should pass maxSegmentLength to segmentation', async () => {
      fakeLLMProvider.setDefaultResponse({
        object: { segments: ['Segment'] }
      });

      await processDocument({
        text: MEDIUM_TEXT,
        llmProvider: fakeLLMProvider as any,
        modelConfig,
        maxSegmentLength: 2000
      });

      const callHistory = fakeLLMProvider.getCallHistory();
      const segmentationCall = callHistory.find((call) => {
        const content = call.messages?.[0]?.content as string;
        return content?.includes('TEXT TO SEGMENT');
      });

      const promptContent = segmentationCall?.messages?.[0]?.content as string;
      expect(promptContent).toContain('2000');
    });

    it('should pass charsPerLLMCall to segmentation', async () => {
      fakeLLMProvider.setDefaultResponse({
        object: { segments: ['Segment'] }
      });

      const text = 'x'.repeat(3000);
      await processDocument({
        text,
        llmProvider: fakeLLMProvider as any,
        modelConfig,
        charsPerLLMCall: 1000
      });

      const callHistory = fakeLLMProvider.getCallHistory();
      const segmentationCalls = callHistory.filter((call) => {
        const content = call.messages?.[0]?.content as string;
        return content?.includes('TEXT TO SEGMENT');
      });

      // 3000 chars / 1000 per call = 3 calls
      expect(segmentationCalls.length).toBe(3);
    });

    it('should pass validateTextPreservation to segmentation', async () => {
      fakeLLMProvider.setDefaultResponse({
        object: { segments: ['Segment'] }
      });

      // This should not throw, just test that it's passed through
      const result = await processDocument({
        text: MEDIUM_TEXT,
        llmProvider: fakeLLMProvider as any,
        modelConfig,
        validateTextPreservation: true
      });

      expect(result).toBeDefined();
    });

    it('should pass documentId to analysis', async () => {
      fakeLLMProvider.addResponse('TEXT TO SEGMENT', {
        object: { segments: ['Segment'] }
      });

      fakeLLMProvider.addResponse('Beginning of document:', {
        object: {}
      });

      fakeLLMProvider.addResponse('PORTION TO ANALYZE', {
        object: { summary: 'Summary' }
      });

      const customDocId = 'custom-doc-456';
      const result = await processDocument({
        text: MEDIUM_TEXT,
        llmProvider: fakeLLMProvider as any,
        modelConfig,
        documentId: customDocId
      });

      expect(result.documentId).toBe(customDocId);
      expect(result.segmentAnalyses[0].parentDocId).toBe(customDocId);
    });
  });

  describe('workflow integration', () => {
    it('should pass segmented text to analysis', async () => {
      const expectedSegments = ['First segment text', 'Second segment text'];

      fakeLLMProvider.addResponse('TEXT TO SEGMENT', {
        object: { segments: expectedSegments }
      });

      fakeLLMProvider.addResponse('Beginning of document:', {
        object: {}
      });

      fakeLLMProvider.addResponse('PORTION TO ANALYZE', {
        object: { summary: 'Summary' }
      });

      const result = await processDocument({
        text: MEDIUM_TEXT,
        llmProvider: fakeLLMProvider as any,
        modelConfig
      });

      expect(result.segmentAnalyses[0].segment).toBe(expectedSegments[0]);
      expect(result.segmentAnalyses[1].segment).toBe(expectedSegments[1]);
    });

    it('should use fullText for metadata extraction', async () => {
      fakeLLMProvider.addResponse('TEXT TO SEGMENT', {
        object: { segments: ['Segment'] }
      });

      fakeLLMProvider.addResponse('Beginning of document:', {
        object: { title: 'Title from full text' }
      });

      fakeLLMProvider.addResponse('PORTION TO ANALYZE', {
        object: { summary: 'Summary' }
      });

      const result = await processDocument({
        text: MEDIUM_TEXT,
        llmProvider: fakeLLMProvider as any,
        modelConfig
      });

      expect(result.metadata.title).toBe('Title from full text');
    });
  });

  describe('processing metadata', () => {
    it('should include per-segment average cost', async () => {
      fakeLLMProvider.addResponse('TEXT TO SEGMENT', {
        object: { segments: ['Seg1', 'Seg2'] },
        costs: { input: 0.001, output: 0.001, total: 0.002 }
      });

      fakeLLMProvider.addResponse('Beginning of document:', {
        object: {},
        costs: { input: 0.001, output: 0.001, total: 0.002 }
      });

      fakeLLMProvider.addResponse('PORTION TO ANALYZE', {
        object: { summary: 'Summary' },
        costs: { input: 0.002, output: 0.002, total: 0.004 }
      });

      const result = await processDocument({
        text: MEDIUM_TEXT,
        llmProvider: fakeLLMProvider as any,
        modelConfig
      });

      // Per segment average is calculated in documentAnalysis
      expect(result.processingMetadata.costs.perSegmentAverage).toBeDefined();
    });

    it('should include all processing metadata from analysis', async () => {
      fakeLLMProvider.addResponse('TEXT TO SEGMENT', {
        object: { segments: ['Seg1', 'Seg2', 'Seg3'] }
      });

      fakeLLMProvider.addResponse('Beginning of document:', {
        object: {}
      });

      fakeLLMProvider.addResponse('PORTION TO ANALYZE', {
        object: {
          summary: 'Summary',
          standaloneFacts: ['Fact1', 'Fact2']
        }
      });

      const result = await processDocument({
        text: MEDIUM_TEXT,
        llmProvider: fakeLLMProvider as any,
        modelConfig
      });

      expect(result.processingMetadata.segmentsAnalyzed).toBe(3);
      expect(result.processingMetadata.summariesGenerated).toBe(3);
      expect(result.processingMetadata.factsExtracted).toBe(6); // 3 segments * 2 facts
      expect(result.processingMetadata.processingTimeMs).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should propagate segmentation errors', async () => {
      const errorProvider = {
        generateObjectParallel: async () => {
          throw new Error('Segmentation failed');
        }
      };

      await expect(
        processDocument({
          text: MEDIUM_TEXT,
          llmProvider: errorProvider as any,
          modelConfig
        })
      ).rejects.toThrow('Segmentation failed');
    });

    it('should propagate analysis errors', async () => {
      let callCount = 0;
      const errorProvider = {
        generateObjectParallel: async () => {
          callCount++;
          if (callCount === 1) {
            // First call (segmentation) succeeds
            return [
              {
                object: { segments: ['Segment'] },
                finishReason: 'stop' as const,
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
              }
            ];
          }
          throw new Error('Analysis failed');
        },
        generateObject: async () => {
          throw new Error('Analysis failed');
        }
      };

      await expect(
        processDocument({
          text: MEDIUM_TEXT,
          llmProvider: errorProvider as any,
          modelConfig
        })
      ).rejects.toThrow('Analysis failed');
    });
  });

  describe('large document handling', () => {
    it('should handle long documents', async () => {
      fakeLLMProvider.addResponse('TEXT TO SEGMENT', {
        object: { segments: ['Long segment 1', 'Long segment 2'] }
      });

      fakeLLMProvider.addResponse('Beginning of document:', {
        object: { title: 'Long Document' }
      });

      fakeLLMProvider.addResponse('PORTION TO ANALYZE', {
        object: { summary: 'Summary' }
      });

      const result = await processDocument({
        text: LONG_TEXT,
        llmProvider: fakeLLMProvider as any,
        modelConfig
      });

      expect(result.segmentAnalyses).toHaveLength(2);
      expect(result.documentId).toBeDefined();
    });

    it('should handle many segments efficiently', async () => {
      const manySegments = Array.from({ length: 50 }, (_, i) => `Segment ${i}`);

      fakeLLMProvider.addResponse('TEXT TO SEGMENT', {
        object: { segments: manySegments }
      });

      fakeLLMProvider.addResponse('Beginning of document:', {
        object: {}
      });

      fakeLLMProvider.addResponse('PORTION TO ANALYZE', {
        object: { summary: 'Summary' }
      });

      const result = await processDocument({
        text: LONG_TEXT,
        llmProvider: fakeLLMProvider as any,
        modelConfig
      });

      expect(result.segmentAnalyses).toHaveLength(50);
    });
  });

  describe('model configuration', () => {
    it('should use provided model config for all operations', async () => {
      fakeLLMProvider.setDefaultResponse({
        object: { segments: ['Segment'] }
      });

      const customModelConfig = createFakeModelConfig({
        primary: 'custom-model-v2',
        fallback: 'fallback-model-v1'
      });

      await processDocument({
        text: MEDIUM_TEXT,
        llmProvider: fakeLLMProvider as any,
        modelConfig: customModelConfig
      });

      const callHistory = fakeLLMProvider.getCallHistory();
      expect(callHistory.every((call) => call.modelConfig.primary === 'custom-model-v2')).toBe(true);
    });
  });

  describe('empty and edge cases', () => {
    it('should handle empty segment list', async () => {
      fakeLLMProvider.addResponse('TEXT TO SEGMENT', {
        object: { segments: [] }
      });

      fakeLLMProvider.addResponse('Beginning of document:', {
        object: {}
      });

      fakeLLMProvider.addResponse('PORTION TO ANALYZE', {
        object: { summary: 'Summary' }
      });

      const result = await processDocument({
        text: 'Short text',
        llmProvider: fakeLLMProvider as any,
        modelConfig
      });

      expect(result.segmentAnalyses).toHaveLength(0);
    });

    it('should handle single segment', async () => {
      fakeLLMProvider.addResponse('TEXT TO SEGMENT', {
        object: { segments: ['Only segment'] }
      });

      fakeLLMProvider.addResponse('Beginning of document:', {
        object: {}
      });

      fakeLLMProvider.addResponse('PORTION TO ANALYZE', {
        object: { summary: 'Summary' }
      });

      const result = await processDocument({
        text: 'Very short',
        llmProvider: fakeLLMProvider as any,
        modelConfig
      });

      expect(result.segmentAnalyses).toHaveLength(1);
    });
  });
});
