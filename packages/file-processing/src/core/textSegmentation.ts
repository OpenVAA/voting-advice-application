import { setPromptVars } from '@openvaa/llm-refactor';
import { z } from 'zod';
import { loadPrompt } from '../utils/promptLoader';
import type { LLMObjectGenerationOptions } from '@openvaa/llm-refactor';
import type { SegmentationOptions, SegmentationResult } from './textSegmentation.type';

const segmentationSchema = z.object({
  segments: z.array(z.string())
});

/**
 * Validate that the text preservation is correct
 * TODO: Implement proper validation logic
 */
function validateTextPreservation(inputText: string, segments: Array<string>): boolean {
  // For now, just return true
  // Future: Calculate character diff, check for missing content, etc.
  return true;
}

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
 *   modelConfig: { primary: 'gemini-2.5-flash-preview-09-2025' }
 * });
 * console.log(result.segments);
 * console.log(`Cost: $${result.metadata.costs.total}`);
 * ```
 */
export async function segmentText(options: SegmentationOptions): Promise<SegmentationResult> {
  const { text, llmProvider, modelConfig, validatePreservation = true } = options;

  // Create 10000 character parts of the input text to avoid context window issues
  const inputTextParts: Array<string> = [];
  for (let i = 0; i < text.length; i += 10000) {
    inputTextParts.push(text.slice(i, i + 10000));
  }

  const prompt = (await loadPrompt({ promptFileName: 'segmentation' })).prompt;

  const requests = inputTextParts.map((part) => ({
    messages: [
      {
        role: 'user',
        content: setPromptVars({ promptText: prompt, variables: { text: part } })
      }
    ],
    modelConfig,
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
  if (validatePreservation && !validateTextPreservation(text, segments)) {
    throw new Error('Text preservation validation failed');
  }

  // Calculate costs
  const totalCost = responses.map((response) => response.costs.total).reduce((sum, cost) => sum + cost, 0);

  return {
    segments,
    metadata: {
      segmentCount: segments.length,
      totalCharacters: text.length,
      averageSegmentLength: segments.reduce((sum, s) => sum + s.length, 0) / segments.length,
      costs: {
        total: totalCost,
        currency: 'USD'
      }
    }
  };
}
