import { analyzeDocument } from './core/documentAnalysis';
import { convertPdfToMarkdown } from './core/pdfProcessor';
import { segmentText } from './core/textSegmentation';
import type {
  PdfPreProcessingOptions,
  PdfPreProcessingResult,
  TextPreProcessingOptions,
  TextPreProcessingResult
} from './api.type';


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
export async function processText(options: TextPreProcessingOptions): Promise<TextPreProcessingResult> {
  const {
    text,
    llmProvider,
    modelConfig,
    documentId,
    minSegmentLength,
    maxSegmentLength,
    charsPerLLMCall,
    validateTextPreservation
  } = options;

  // Step 1: Segment the text
  const segmentationResult = await segmentText({
    text,
    llmProvider,
    modelConfig,
    minSegmentLength,
    maxSegmentLength,
    charsPerLLMCall,
    validateTextPreservation
  });

  // Step 2: Analyze the document and segments
  const analysisResult = await analyzeDocument({
    fullText: text,
    segments: segmentationResult.segments,
    llmProvider,
    modelConfig,
    documentId
  });

  // Merge costs from both operations
  const combinedCosts = {
    total: segmentationResult.metadata.costs.total + analysisResult.processingMetadata.costs.total,
    perSegmentAverage: analysisResult.processingMetadata.costs.perSegmentAverage,
    currency: 'USD' as const
  };

  return {
    ...analysisResult,
    processingMetadata: {
      ...analysisResult.processingMetadata,
      costs: combinedCosts
    }
  };
}

export async function processPdf(options: PdfPreProcessingOptions): Promise<PdfPreProcessingResult> {
  const {
    pdfBuffer,
    apiKey,
    model,
    originalFileName,
    llmProvider,
    modelConfig,
    documentId,
    minSegmentLength,
    maxSegmentLength,
    charsPerLLMCall,
    validateTextPreservation
  } = options;

  const markdown = await convertPdfToMarkdown({ pdfBuffer, apiKey, model, originalFileName });

  return processText({
    text: markdown.markdown,
    llmProvider,
    modelConfig,
    documentId,
    minSegmentLength,
    maxSegmentLength,
    charsPerLLMCall,
    validateTextPreservation
  });
}
