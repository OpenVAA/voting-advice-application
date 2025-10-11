import { setPromptVars } from '@openvaa/llm-refactor';
import { z } from 'zod';
import { loadPrompt } from '../utils/promptLoader';
import type { LLMModelConfig, LLMObjectGenerationOptions, LLMProvider } from '@openvaa/llm-refactor';
import type { ModelMessage } from 'ai';
import type { ExcerptSummary, SourceDocument, SourceExcerpt } from '../types';
import type { SourceMetadata } from '../types/source.types';

// --------------------------------------------------------------
// TYPES
// --------------------------------------------------------------

/** @example
 * ```typescript
 * {
 *   excerpts: [excerpt1, excerpt2],
 *   excerptSummaries: [excerptSummary1, excerptSummary2],
 *   fullDocument: sourceDocument
 * }
 * ```
 */
export interface DocProcessingResult {
  excerpts: Array<SourceExcerpt>;
  excerptSummaries: Array<ExcerptSummary>;
  fullDocument: SourceDocument;
}

export interface DocProcessingOptions {
  inputText: string;
  provider: LLMProvider;
  modelConfig: LLMModelConfig;
}

// --------------------------------------------------------------
// LLM RESPONSE SCHEMAS
// --------------------------------------------------------------

const metadataExtractionSchema = z.object({
  title: z.string().optional(),
  source: z.string().optional(),
  authors: z.array(z.string()).optional(),
  publishedDate: z.string().optional(),
  locale: z.string().optional()
});

const segmentationSchema = z.object({
  segments: z.array(z.string())
});

const summarizationSchema = z.object({
  summaries: z.array(z.string())
});

// --------------------------------------------------------------
// MAIN FUNCTION
// --------------------------------------------------------------

// TODO: Implement this function.
/**
 * Process the input text into a document
 * @param options - The options for the document processing
 * @returns The processed document
 */
export async function processDocument(options: DocProcessingOptions) {
  const { inputText } = options;

  return {
    excerpts: [],
    excerptSummaries: [],
    fullDocument: { id: '1', content: inputText, metadata: {} }
  };
}

// --------------------------------------------------------------
// FUNCTIONS
// --------------------------------------------------------------

/**
 * Segment the input text into excerpts
 * @param options - The options for the document processing
 * @returns The excerpts segmented from the input text
 */
export async function segmentInputText(options: DocProcessingOptions) {
  const { inputText, provider } = options;
  // Create 50000 character parts of the input text to avoid context window funkiness
  const inputTextParts: Array<string> = [];
  for (let i = 0; i < inputText.length; i += 10000) {
    inputTextParts.push(inputText.slice(i, i + 10000));
  }

  const prompt = (await loadPrompt({ promptFileName: 'segmentation' })).prompt;
  const requests = inputTextParts.map((part) => ({
    messages: [
      {
        role: 'user',
        content: setPromptVars({ promptText: prompt, variables: { text: part } })
      }
    ],
    modelConfig: options.modelConfig,
    schema: segmentationSchema,
    temperature: 0.7,
    maxRetries: 3,
    validationRetries: 3
  })) as Array<LLMObjectGenerationOptions<{ segments: Array<string> }>>;

  const responses = await provider.generateObjectParallel({
    requests,
    maxConcurrent: 4
  });

  // TODO: actually implement validation. This is just a placeholder.
  if (!validateTextPreservation(inputText, responses.map((response) => response.object.segments).flat())) {
    throw new Error('Text preservation is not correct');
  }

  console.info(
    'Costs: ',
    responses.map((response) => response.costs.total).reduce((sum, cost) => sum + cost, 0)
  );

  return responses.map((response) => response.object.segments).flat() as Array<string>;
}

/**
 * Summarize the input text
 * @param options - The options for the document processing
 * @returns The summarized text
 */
export async function summarizeInputText(options: DocProcessingOptions) {
  const { inputText, provider } = options;

  const prompt = (await loadPrompt({ promptFileName: 'summarization' })).prompt;

  const messages = [
    {
      role: 'user',
      content: setPromptVars({ promptText: prompt, variables: { segmentWithContext: inputText } })
    }
  ] as Array<ModelMessage>;

  const response = await provider.generateObject({
    modelConfig: options.modelConfig,
    schema: summarizationSchema,
    messages,
    temperature: 0.7,
    maxRetries: 3,
    validationRetries: 3
  });

  return response.object.summaries as Array<string>;
}

/**
 * Extract the metadata from the input text
 * @param options - The options for the document processing
 * @returns The metadata extracted from the input text
 */
export async function extractMetadata(options: DocProcessingOptions) {
  const { inputText, provider } = options;

  // Get the first and last 500 characters of the input text
  const first500 = inputText.slice(0, 500);
  const last500 = inputText.slice(-500);

  const prompt = (await loadPrompt({ promptFileName: 'metadataExtraction' })).prompt;

  // Create the messages for the LLM
  const messages = [
    {
      role: 'user',
      content: setPromptVars({ promptText: prompt, variables: { documentStart: first500, documentEnd: last500 } })
    }
  ] as Array<ModelMessage>;

  const response = await provider.generateObject({
    modelConfig: options.modelConfig,
    schema: metadataExtractionSchema,
    messages,
    temperature: 0.7,
    maxRetries: 3,
    validationRetries: 3
  });

  return response.object as SourceMetadata;
}

// --------------------------------------------------------------
// HELPERS
// --------------------------------------------------------------

/**
 * Validate that the text preservation is correct. Calculate the number of different characters between the input text and the segments.
 * @param inputText - The input text
 * @param segments - The segments
 * @returns True if the text preservation is correct, false otherwise
 */
function validateTextPreservation(inputText: string, segments: Array<string>) {
  return true; // TODO: Implement this depending on how the LLM modifies the text or preserves the text.
}
