import { setPromptVars } from '@openvaa/llm-refactor';
import { z } from 'zod';
import { isTextPreserved, loadPrompt } from '../utils';
import type { LLMObjectGenerationOptions } from '@openvaa/llm-refactor';
import type { SegmentTextOptions, SegmentTextResult } from './textSegmentation.type';

// TODO: use controller to track progress

const segmentationSchema = z.object({
  segments: z.array(z.string())
});

/**
 * Segment text into logical chunks using LLM
 *
 * @param options - Segmentation options
 * @returns Segmented text with metadata
 *
 * @example
 * ```typescript
 * const result = await segmentText({
 *   text: markdownContent,
 *   llmProvider: provider,
 *   modelConfig: { primary: 'gemini-2.5-flash-preview-09-2025' },
 *   minSegmentLength: 300,
 *   maxSegmentLength: 2500,
 *   charsPerLLMCall: 10000,
 *   validateTextPreservation: false
 * });
 *
 * const printResult = {
 *   segments: [
 *     'Segment 1',
 *     'Segment 2',
 *     'Segment 3',
 *   ],
 *   metadata: {
 *     segmentCount: 3,
 *     totalCharacters: 1000,
 *     averageSegmentLength: 333.33,
 *     minSegmentLength: 300,
 *     maxSegmentLength: 2500,
 *     costs: {
 *       total: 0.21,
 *       currency: 'USD'
 *     },
 *     processingTimeMs: 1000
 *   }
 * }
 * ```
 */
export async function segmentText(options: SegmentTextOptions): Promise<SegmentTextResult> {
  const startTime = new Date();
  const {
    text,
    llmProvider,
    runId,
    minSegmentLength = 500,
    maxSegmentLength = 1000,
    charsPerLLMCall = 10000,
    validateTextPreservation = false // TODO: implement validation and set default to true. It's just such a nested if-else hell.
  } = options;

  // Create charsPerLLMCall character parts of the input text to avoid context window issues
  const inputTextParts: Array<string> = [];
  for (let i = 0; i < text.length; i += charsPerLLMCall) {
    inputTextParts.push(text.slice(i, i + charsPerLLMCall));
  }

  const promptData = await loadPrompt({ promptFileName: 'segmentation' });

  const requests = inputTextParts.map((part) => ({
    messages: [
      {
        role: 'user',
        content: setPromptVars({
          promptText: promptData.prompt,
          variables: {
            text: part,
            minSegmentLength: minSegmentLength.toString(),
            maxSegmentLength: maxSegmentLength.toString()
          }
        })
      }
    ],
    schema: segmentationSchema,
    temperature: 0.7,
    maxRetries: 3,
    validationRetries: 3
  })) as Array<LLMObjectGenerationOptions<{ segments: Array<string> }>>;

  const responses = await llmProvider.generateObjectParallel({
    requests,
    maxConcurrent: 4
  });

  const segments = responses.map((response) => response.object.segments).flat();

  // Validate text preservation if enabled
  if (validateTextPreservation && !isTextPreserved()) {
    // add params to isTextPreserved, if you actually implement the text preservation validation
    console.info('Text preservation validation failed');
  }

  // Calculate costs
  const totalCost = responses.reduce((sum, response) => sum + response.costs.total, 0);
  const totalInputCost = responses.reduce((sum, response) => sum + response.costs.input, 0);
  const totalOutputCost = responses.reduce((sum, response) => sum + response.costs.output, 0);

  // Calculate actual segment lengths
  const segmentLengths = segments.map((s) => s.length);
  const actualMinLength = Math.min(...segmentLengths);
  const actualMaxLength = Math.max(...segmentLengths);
  const totalTokens = responses.reduce((sum, response) => sum + (response?.usage?.totalTokens || 0), 0);
  const totalInputTokens = responses.reduce((sum, response) => sum + (response?.usage?.inputTokens || 0), 0);
  const totalOutputTokens = responses.reduce((sum, response) => sum + (response?.usage?.outputTokens || 0), 0);

  return {
    runId,
    data: {
      segments,
      metrics: {
        segmentCount: segments.length,
        totalCharacters: text.length,
        averageSegmentLength: segments.reduce((sum, s) => sum + s.length, 0) / segments.length,
        minSegmentLength: actualMinLength,
        maxSegmentLength: actualMaxLength,
        segmentLengths,
      }
    },
    llmMetrics: {
      processingTimeMs: new Date().getTime() - startTime.getTime(),
      nLlmCalls: responses.length,
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
      modelsUsed: Array.from(new Set(responses.map((response) => response.model))),
      language: 'en', // TODO: infer and route the 
      startTime,
      endTime: new Date()
    }
  };
}
