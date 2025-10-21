import { setPromptVars } from '@openvaa/llm-refactor';
import { z } from 'zod';
import { loadPrompt } from './promptLoader';
import type { LLMProvider } from '@openvaa/llm-refactor';
import type { ModelMessage } from 'ai';
import type { SourceSegment } from '../types/source.types';

// ----------------------------------------
// RESPONSE SCHEMA
// ----------------------------------------
const searchResultFilteringSchema = z.object({
  acceptedIndices: z.array(z.number())
});

// ----------------------------------------
// CONSTANTS
// ----------------------------------------
const BATCH_SIZE = 3;

/**
 * Filters search results using LLM to determine relevance to query
 * Batches segments into groups of 3 and processes them in parallel for improved performance
 *
 * @param query - The user's search query
 * @param segments - Array of segments to filter
 * @param provider - LLM provider for intelligent filtering
 * @returns Filtered array of segments that are relevant to the query
 *
 * @example
 * ```typescript
 * const filtered = await filterSearchResults({
 *   query: "What is the voting age?",
 *   segments: searchResults,
 *   provider: llmProvider,
 *   modelConfig: { model: 'gpt-4o-mini' }
 * });
 * ```
 */
export async function filterSearchResults({
  query,
  segments,
  provider
}: {
  query: string;
  segments: Array<SourceSegment>;
  provider: LLMProvider;
}): Promise<Array<SourceSegment>> {
  if (segments.length === 0) return [];

  // Load prompt template once
  const promptTemplate = (await loadPrompt({ promptFileName: 'searchResultFiltering' })).prompt;

  // Split segments into batches of BATCH_SIZE
  const batches: Array<{ segments: Array<SourceSegment>; startIndex: number }> = [];
  for (let i = 0; i < segments.length; i += BATCH_SIZE) {
    batches.push({
      segments: segments.slice(i, i + BATCH_SIZE),
      startIndex: i
    });
  }

  // Process batches in parallel
  const batchResults = await Promise.all(
    batches.map(async ({ segments: batchSegments, startIndex }) => {
      // Format segments with 0-based indices for this batch
      const formattedResults = batchSegments
        .map((segment, idx) => `[${idx}] ${segment.content}`)
        .join('\n\n');

      // Fill prompt variables
      const filledPrompt = setPromptVars({
        promptText: promptTemplate,
        variables: {
          query,
          searchResults: formattedResults
        }
      });

      // Call LLM
      const response = await provider.generateObject({
        messages: [{ role: 'user', content: filledPrompt } as ModelMessage],
        schema: searchResultFilteringSchema,
        temperature: 0,
        maxRetries: 3,
        validationRetries: 3
      });

      // Map batch indices back to original indices
      return response.object.acceptedIndices.map((batchIdx) => startIndex + batchIdx);
    })
  );

  // Flatten all accepted indices
  const acceptedIndices = new Set(batchResults.flat());

  // Filter segments based on accepted indices
  return segments.filter((_, idx) => acceptedIndices.has(idx));
}
