import { setPromptVars } from '@openvaa/llm-refactor';
import { z } from 'zod';
import { loadPrompt } from './promptLoader';
import type { LLMModelConfig, LLMProvider } from '@openvaa/llm-refactor';
import type { SourceSegment } from '../types';

// ----------------------------------------
// RESPONSE SCHEMA
// ----------------------------------------
const searchResultFilteringSchema = z.object({
  reasoning: z.string(),
  acceptedIndices: z.array(z.number())
});

/**
 * Filters search results using LLM to determine relevance to query
 *
 * @param query - The user's search query
 * @param segments - Array of segments to filter
 * @param provider - LLM provider for intelligent filtering
 * @param modelConfig - Model configuration for the LLM
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
  provider,
  modelConfig
}: {
  query: string;
  segments: Array<SourceSegment>;
  provider: LLMProvider;
  modelConfig: LLMModelConfig;
}): Promise<Array<SourceSegment>> {
  if (segments.length === 0) return [];

  // Load prompt
  const promptTemplate = (await loadPrompt({ promptFileName: 'searchResultFiltering' })).prompt;

  // Format segments with indices (no metadata)
  const formattedResults = segments.map((segment, idx) => `[${idx}] ${segment.content}`).join('\n\n');

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
    messages: [{ role: 'user', content: filledPrompt }],
    modelConfig,
    schema: searchResultFilteringSchema,
    temperature: 0,
    maxRetries: 3,
    validationRetries: 3
  });

  // Filter segments based on accepted indices
  const acceptedIndices = new Set(response.object.acceptedIndices);
  return segments.filter((_, idx) => acceptedIndices.has(idx));
}
