import { setPromptVars } from '@openvaa/llm-refactor';
import { z } from 'zod';
import { loadPrompt } from '../utils/promptLoader.js';
// TODO: use controller to track progress
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
 * @returns Object containing extracted metadata and the response with cost information
 *
 * @example
 * ```typescript
 * const { metadata, response } = await extractMetadata({
 *   fullText: markdownContent,
 *   llmProvider: provider, // Gemini Provider
 *   modelConfig: { primary: 'gemini-2.5-flash-preview-09-2025' }
 * });
 * ```
 */
async function extractMetadata(options) {
    const { text, llmProvider } = options;
    // Get the first and last 500 characters of the input text
    const first500 = text.slice(0, 500);
    const last500 = text.slice(-500);
    const prompt = (await loadPrompt({ promptFileName: 'metadataExtraction' })).prompt;
    const messages = [
        {
            role: 'user',
            content: setPromptVars({ promptText: prompt, variables: { documentStart: first500, documentEnd: last500 } })
        }
    ];
    const response = await llmProvider.generateObject({
        messages,
        schema: metadataExtractionSchema,
        temperature: 0.7,
        maxRetries: 3,
        validationRetries: 3
    });
    return {
        metadata: response.object,
        response
    };
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
export async function analyzeDocument(options) {
    const startTime = new Date();
    const { text, segments, llmProvider, runId, documentId, controller } = options;
    // Generate document ID if not provided
    const finalDocumentId = documentId || `${crypto.randomUUID()}`;
    // Extract metadata from the full text
    controller?.info(`Extracting document metadata using ${llmProvider.config.provider}'s ${llmProvider.config.modelConfig.primary}`);
    const { metadata, response: metadataResponse } = await extractMetadata({
        text,
        llmProvider,
        runId,
        controller
    });
    // Analyze segments with LLM
    const prompt = (await loadPrompt({ promptFileName: 'segmentAnalysis' })).prompt;
    const requests = segments.map((_, index) => {
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
            ],
            schema: segmentAnalysisSchema,
            temperature: 0.7,
            maxRetries: 3,
            validationRetries: 3
        };
    });
    // Process segments in parallel
    controller?.info(`Analyzing segments using ${llmProvider.config.provider}'s ${llmProvider.config.modelConfig.primary}`);
    const responses = await llmProvider.generateObjectParallel({
        requests,
        maxConcurrent: 4,
        controller
    });
    const allResponses = [metadataResponse, ...responses];
    // Calculate costs including metadata extraction
    const totalCost = allResponses.reduce((sum, response) => sum + response.costs.total, 0);
    const totalInputCost = allResponses.reduce((sum, response) => sum + response.costs.input, 0);
    const totalOutputCost = allResponses.reduce((sum, response) => sum + response.costs.output, 0);
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
    const processingTimeMs = new Date().getTime() - startTime.getTime();
    const totalTokens = allResponses.reduce((sum, response) => sum + (response.usage.totalTokens || 0), 0);
    const totalInputTokens = allResponses.reduce((sum, response) => sum + (response.usage.inputTokens || 0), 0);
    const totalOutputTokens = allResponses.reduce((sum, response) => sum + (response.usage.outputTokens || 0), 0);
    return {
        runId,
        data: {
            documentId: finalDocumentId,
            sourceMetadata: metadata,
            segmentAnalyses,
            metrics: {
                nSegments: segments.length,
                nFactsExtracted: factsExtracted,
                nLlmCalls: allResponses.length,
                costs: {
                    total: totalCost,
                    input: totalInputCost,
                    output: totalOutputCost
                },
                tokens: {
                    totalTokens,
                    inputTokens: totalInputTokens,
                    outputTokens: totalOutputTokens
                },
                processingTimeMs
            }
        },
        llmMetrics: {
            processingTimeMs,
            nLlmCalls: allResponses.length,
            costs: {
                total: totalCost,
                input: totalInputCost,
                output: totalOutputCost
            },
            tokens: {
                totalTokens,
                inputTokens: totalInputTokens,
                outputTokens: totalOutputTokens
            }
        },
        success: true,
        metadata: {
            modelsUsed: Array.from(new Set(allResponses.map((response) => response.model))),
            language: 'en', // TODO: infer and route the
            startTime,
            endTime: new Date()
        }
    };
}
/**
 * Helper: Get context from segments until minimum character count is reached
 */
function getContextFromSegments(options) {
    const { segments, startIndex, minChars, direction } = options;
    const contextSegments = [];
    let totalChars = 0;
    if (direction === 'forward') {
        for (let i = startIndex; i < segments.length && totalChars < minChars; i++) {
            contextSegments.push(segments[i]);
            totalChars += segments[i].length;
        }
    }
    else {
        for (let i = startIndex; i >= 0 && totalChars < minChars; i--) {
            contextSegments.unshift(segments[i]);
            totalChars += segments[i].length;
        }
    }
    return contextSegments.join('\n\n');
}
/**
 * Helper: Create segment with sliding window context and markers
 */
function createSegmentWithContext(options) {
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
    }
    else if (index === segments.length - 1) {
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
    }
    else {
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
        const parts = [];
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
