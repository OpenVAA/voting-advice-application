import { setPromptVars } from '@openvaa/llm-refactor';
import { z } from 'zod';
import { loadPrompt } from '../utils/promptLoader';
import type { LLMObjectGenerationOptions } from '@openvaa/llm-refactor';
import type { ModelMessage } from 'ai';
import type {
  ExtractMetadataOptions,
  SourceMetadata,
  TextAnalysisOptions,
  TextAnalysisResult
} from './documentAnalysis.type';

const metadataExtractionSchema = z.object({
  title: z.string().optional(),
  source: z.string().optional(),
  authors: z.array(z.string()).optional(),
  publishedDate: z.string().optional(),
  locale: z.string().optional()
});

const segmentAnalysisSchema = z.object({
  summary: z.string(),
  standaloneFacts: z.array(z.string()).optional()
});

/**
 * Extract metadata from document text
 *
 * @param options - Extract metadata options
 * @returns Extracted metadata
 *
 * @example
 * ```typescript
 * const metadata = await extractMetadata({
 *   fullText: markdownContent,
 *   llmProvider: provider, // Gemini Provider
 *   modelConfig: { primary: 'gemini-2.5-flash-preview-09-2025' }
 * });
 * ```
 */
async function extractMetadata(options: ExtractMetadataOptions): Promise<SourceMetadata> {
  const { fullText, llmProvider, modelConfig } = options;

  // Get the first and last 500 characters of the input text
  const first500 = fullText.slice(0, 500);
  const last500 = fullText.slice(-500);

  const prompt = (await loadPrompt({ promptFileName: 'metadataExtraction' })).prompt;

  const messages = [
    {
      role: 'user',
      content: setPromptVars({ promptText: prompt, variables: { documentStart: first500, documentEnd: last500 } })
    }
  ] as Array<ModelMessage>;

  const response = await llmProvider.generateObject({
    messages,
    modelConfig,
    schema: metadataExtractionSchema,
    temperature: 0.7,
    maxRetries: 3,
    validationRetries: 3
  });

  return response.object as SourceMetadata;
}

/**
 * Analyze a document by extracting metadata and analyzing each segment
 *
 * @param options - Document analysis options
 * @returns Complete analysis result with metadata and segment analyses
 *
 * @example
 * ```typescript
 * const result = await analyzeDocument({
 *   fullText: markdownContent,
 *   segments: segmentedText,
 *   llmProvider: provider,
 *   modelConfig: { primary: 'gemini-2.5-flash-preview-09-2025' },
 *   documentId: 'my-doc-123'
 * });
 * console.log(result.segmentAnalyses);
 * ```
 */
export async function analyzeDocument(options: TextAnalysisOptions): Promise<TextAnalysisResult> {
  const startTime = performance.now();
  const { fullText, segments, llmProvider, modelConfig, documentId } = options;

  // Generate document ID if not provided
  const finalDocumentId = documentId || `${crypto.randomUUID()}`;

  // Extract metadata from the full text
  const metadata = await extractMetadata({
    fullText,
    llmProvider,
    modelConfig
  });

  // Analyze segments with LLM
  const prompt = (await loadPrompt({ promptFileName: 'segmentAnalysis' })).prompt;

  const requests = segments.map((segment, index) => {
    const segmentWithContext = createSegmentWithContext({
      segments,
      index
    });

    return {
      messages: [
        {
          role: 'user',
          content: setPromptVars({ promptText: prompt, variables: { segmentWithContext } })
        }
      ] as Array<ModelMessage>,
      modelConfig,
      schema: segmentAnalysisSchema,
      temperature: 0.7,
      maxRetries: 3,
      validationRetries: 3
    };
  }) as Array<LLMObjectGenerationOptions<{ summary: string; standaloneFacts?: Array<string> }>>;

  // Process segments in parallel
  const responses = await llmProvider.generateObjectParallel({
    requests,
    maxConcurrent: 4
  });

  // Calculate costs
  const totalCost = responses.map((response) => response.costs.total).reduce((sum, cost) => sum + cost, 0);

  // Map responses to segment analyses
  const segmentAnalyses = responses.map((response, index) => ({
    parentDocId: finalDocumentId,
    id: crypto.randomUUID(),
    segment: segments[index],
    segmentIndex: index,
    summary: response.object.summary,
    standaloneFacts: response.object.standaloneFacts || []
  }));

  // Calculate stats
  const factsExtracted = segmentAnalyses.reduce((sum, seg) => sum + (seg.standaloneFacts?.length || 0), 0);
  const processingTimeMs = performance.now() - startTime;

  return {
    documentId: finalDocumentId,
    metadata,
    segmentAnalyses,
    processingMetadata: {
      segmentsAnalyzed: segments.length,
      summariesGenerated: segmentAnalyses.length,
      factsExtracted,
      costs: {
        total: totalCost,
        perSegmentAverage: totalCost / segments.length,
        currency: 'USD'
      },
      processingTimeMs
    }
  };
}

// --------------------------------------------------------------
// HELPER FUNCTIONS
// --------------------------------------------------------------

/** Internal. Used only in the helper below.
 * Gets characters from surrounding segments so we have context for the segment we are analyzing.
 */
interface GetSurroundingSegmentsOptions {
  /** Array of all segments */
  segments: Array<string>;
  /** Starting index for context extraction */
  startIndex: number;
  /** Minimum number of characters to extract */
  minChars: number;
  /** Direction to extract context */
  direction: 'forward' | 'backward';
}


/**
 * Helper: Get context from segments until minimum character count is reached
 */
function getContextFromSegments(options: GetSurroundingSegmentsOptions): string {
  const { segments, startIndex, minChars, direction } = options;

  const contextSegments: Array<string> = [];
  let totalChars = 0;

  if (direction === 'forward') {
    for (let i = startIndex; i < segments.length && totalChars < minChars; i++) {
      contextSegments.push(segments[i]);
      totalChars += segments[i].length;
    }
  } else {
    for (let i = startIndex; i >= 0 && totalChars < minChars; i--) {
      contextSegments.unshift(segments[i]);
      totalChars += segments[i].length;
    }
  }

  return contextSegments.join('\n\n');
}


/** Internal. Used only in the helper below. 
 * Formats a segment with its context for the LLM.
*/
interface CreateSegmentWithContextOptions {
  /** Array of all segments */
  segments: Array<string>;
  /** Index of the segment to create context for */
  index: number;
}

/**
 * Helper: Create segment with sliding window context and markers
 */
function createSegmentWithContext(options: CreateSegmentWithContextOptions): string {
  const { segments, index } = options;
  const segment = segments[index];
  let segmentWithContext = '';

  if (index === 0) {
    const followingContext = getContextFromSegments({
      segments,
      startIndex: index + 1,
      minChars: 1500,
      direction: 'forward'
    });
    segmentWithContext =
      followingContext.length > 0
        ? `<PORTION TO ANALYZE>\n${segment}\n\n<FOLLOWING CONTEXT>\n${followingContext}`
        : `<PORTION TO ANALYZE>\n${segment}`;
  } else if (index === segments.length - 1) {
    const precedingContext = getContextFromSegments({
      segments,
      startIndex: index - 1,
      minChars: 1500,
      direction: 'backward'
    });
    segmentWithContext =
      precedingContext.length > 0
        ? `<PRECEDING CONTEXT>\n${precedingContext}\n\n<PORTION TO ANALYZE>\n${segment}`
        : `<PORTION TO ANALYZE>\n${segment}`;
  } else {
    const precedingContext = getContextFromSegments({
      segments,
      startIndex: index - 1,
      minChars: 1000,
      direction: 'backward'
    });
    const followingContext = getContextFromSegments({
      segments,
      startIndex: index + 1,
      minChars: 500,
      direction: 'forward'
    });

    const parts: Array<string> = [];
    if (precedingContext.length > 0) {
      parts.push(`<PRECEDING CONTEXT>\n${precedingContext}`);
    }
    parts.push(`<PORTION TO ANALYZE>\n${segment}`);
    if (followingContext.length > 0) {
      parts.push(`<FOLLOWING CONTEXT>\n${followingContext}`);
    }

    segmentWithContext = parts.join('\n\n');
  }

  return segmentWithContext;
}
