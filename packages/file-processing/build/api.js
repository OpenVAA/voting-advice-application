import { analyzeDocument } from './core/documentAnalysis.js';
import { convertPdfToMarkdown } from './core/pdfConversion.js';
import { segmentText } from './core/textSegmentation.js';
// TODO: create an utility that stores this API boilerplate
/**
 * Process a document end-to-end: segment and analyze
 * This is a convenience function that chains segmentText and analyzeDocument
 *
 * @param options - Document processing options
 * @returns Complete analysis result
 *
 * @example
 * ```typescript
 * const result = await processText({
 *   text: markdownContent,
 *   llmProvider: provider,
 *   modelConfig: { primary: 'gemini-2.5-flash-preview-09-2025' }
 * });
 * console.log(result.segmentAnalyses);
 * console.log(`Total cost: $${result.processingMetadata.costs.total}`);
 * ```
 */
export async function processText(options) {
    const { text, llmProvider, runId, documentId, minSegmentLength, maxSegmentLength, charsPerLLMCall, validateTextPreservation } = options;
    // Step 1: Segment the text
    const segmentationResult = await segmentText({
        text,
        llmProvider,
        runId,
        minSegmentLength,
        maxSegmentLength,
        charsPerLLMCall,
        validateTextPreservation
    });
    // Step 2: Analyze the document and segments
    const analysisResult = await analyzeDocument({
        text: text,
        segments: segmentationResult.data.segments,
        llmProvider,
        runId,
        sourceId: documentId
    });
    // Combine metrics from both stages
    const processingMetadata = {
        segmentation: segmentationResult.data.metrics,
        analysis: analysisResult.data.metrics
    };
    const combinedLlmMetrics = {
        processingTimeMs: segmentationResult.llmMetrics.processingTimeMs + analysisResult.llmMetrics.processingTimeMs,
        nLlmCalls: segmentationResult.llmMetrics.nLlmCalls + analysisResult.llmMetrics.nLlmCalls,
        costs: {
            total: segmentationResult.llmMetrics.costs.total + analysisResult.llmMetrics.costs.total,
            input: (segmentationResult.llmMetrics.costs.input ?? 0) + (analysisResult.llmMetrics.costs.input ?? 0),
            output: (segmentationResult.llmMetrics.costs.output ?? 0) + (analysisResult.llmMetrics.costs.output ?? 0)
        },
        tokens: {
            totalTokens: (segmentationResult.llmMetrics.tokens.totalTokens || 0) + (analysisResult.llmMetrics.tokens.totalTokens || 0),
            inputTokens: (segmentationResult.llmMetrics.tokens.inputTokens || 0) + (analysisResult.llmMetrics.tokens.inputTokens || 0),
            outputTokens: (segmentationResult.llmMetrics.tokens.outputTokens || 0) + (analysisResult.llmMetrics.tokens.outputTokens || 0)
        }
    };
    const combinedMetadata = {
        ...segmentationResult.metadata,
        ...analysisResult.metadata,
        modelsUsed: [...(segmentationResult.metadata?.modelsUsed || []), ...(analysisResult.metadata?.modelsUsed || [])]
    };
    return {
        runId,
        success: segmentationResult.success && analysisResult.success,
        data: {
            documentId: analysisResult.data.sourceId,
            metadata: analysisResult.data.sourceMetadata,
            segmentAnalyses: analysisResult.data.segmentAnalyses,
            processingMetadata
        },
        llmMetrics: combinedLlmMetrics,
        metadata: combinedMetadata
    };
}
export async function processPdf(options) {
    const { pdfBuffer, apiKey, model, originalFileName, llmProvider, runId, documentId, minSegmentLength, maxSegmentLength, charsPerLLMCall, validateTextPreservation } = options;
    const markdown = await convertPdfToMarkdown({
        pdfBuffer,
        apiKey,
        model,
        originalFileName,
        runId,
        llmProvider
    });
    const textResult = await processText({
        text: markdown.data.markdown,
        llmProvider,
        runId,
        documentId,
        minSegmentLength,
        maxSegmentLength,
        charsPerLLMCall,
        validateTextPreservation
    });
    // Combine metrics from all stages
    const combinedLlmMetrics = {
        ...textResult.llmMetrics,
        processingTimeMs: textResult.llmMetrics.processingTimeMs + markdown.llmMetrics.processingTimeMs,
        nLlmCalls: textResult.llmMetrics.nLlmCalls + markdown.llmMetrics.nLlmCalls,
        costs: {
            total: textResult.llmMetrics.costs.total + markdown.llmMetrics.costs.total,
            input: (textResult.llmMetrics.costs.input ?? 0) + (markdown.llmMetrics.costs.input ?? 0),
            output: (textResult.llmMetrics.costs.output ?? 0) + (markdown.llmMetrics.costs.output ?? 0),
            currency: 'USD'
        },
        tokens: {
            totalTokens: (textResult.llmMetrics.tokens.totalTokens || 0) + (markdown.llmMetrics.tokens.totalTokens || 0),
            inputTokens: (textResult.llmMetrics.tokens.inputTokens || 0) + (markdown.llmMetrics.tokens.inputTokens || 0),
            outputTokens: (textResult.llmMetrics.tokens.outputTokens || 0) + (markdown.llmMetrics.tokens.outputTokens || 0)
        }
    };
    const combinedMetadata = {
        ...textResult.metadata,
        ...markdown.metadata,
        modelsUsed: [...(textResult.metadata?.modelsUsed || []), ...(markdown.metadata?.modelsUsed || [])]
    };
    return {
        ...textResult,
        data: {
            ...textResult.data,
            extractedText: markdown.data.markdown,
            processingMetadata: {
                ...textResult.data.processingMetadata,
                pdfConversion: markdown.llmMetrics
            }
        },
        llmMetrics: combinedLlmMetrics,
        metadata: combinedMetadata
    };
}
