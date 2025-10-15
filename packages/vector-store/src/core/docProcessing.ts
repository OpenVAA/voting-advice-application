import { setPromptVars } from '@openvaa/llm-refactor';
import { z } from 'zod';
import { loadPrompt } from './utils/promptLoader';
import type { LLMModelConfig, LLMObjectGenerationOptions, LLMProvider } from '@openvaa/llm-refactor';
import type { ModelMessage } from 'ai';
import type { SegmentWithAnalysis, SourceMetadata } from './types';

// --------------------------------------------------------------
// TYPES
// --------------------------------------------------------------

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

const segmentAnalysisSchema = z.object({
  summary: z.string(), // summary of the segment
  standaloneFacts: z.array(z.string()).optional() // standalone facts to be embedded IF there are any
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

  // TODO: actually implement validation. This is just a placeholder. Seems like a hassle!
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

/**
 * Analyze segments with LLM to generate summaries and standalone facts
 * @param options - The options including segments array, provider, and model config
 * @returns Array of segment analysis results
 */
export async function analyzeSegments(
  options: DocProcessingOptions & { segments: Array<string>; parentDocId: string }
): Promise<Array<SegmentWithAnalysis>> {
  const { segments, provider, modelConfig } = options;

  const prompt = (await loadPrompt({ promptFileName: 'segmentAnalysis' })).prompt;

  // Create requests for all segments with context
  const requests = segments.map((segment, index) => {
    const segmentWithContext = createSegmentWithContext(segments, index);

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
  const responses = await provider.generateObjectParallel({
    requests,
    maxConcurrent: 4
  });

  console.info(
    'Total costs: $',
    responses
      .map((response) => response.costs.total)
      .reduce((sum, cost) => sum + cost, 0)
      .toFixed(4)
  );

  // Map responses to results
  return responses.map((response, index) => ({
    parentDocId: options.parentDocId,
    id: crypto.randomUUID(),
    segment: segments[index],
    segmentIndex: index,
    summary: response.object.summary,
    standaloneFacts: response.object.standaloneFacts || []
  }));
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

/**
 * Helper: Get context from segments until minimum character count is reached
 */
function getContextFromSegments(
  segments: Array<string>,
  startIndex: number,
  minChars: number,
  direction: 'forward' | 'backward'
): string {
  const contextSegments: Array<string> = [];
  let totalChars = 0;

  if (direction === 'forward') {
    for (let i = startIndex; i < segments.length && totalChars < minChars; i++) {
      contextSegments.push(segments[i]);
      totalChars += segments[i].length;
    }
  } else {
    // backward
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
function createSegmentWithContext(segments: Array<string>, index: number): string {
  const segment = segments[index];
  let segmentWithContext = '';

  if (index === 0) {
    // First segment: no preceding context, at least 1500 chars following
    const followingContext = getContextFromSegments(segments, index + 1, 1500, 'forward');

    segmentWithContext =
      followingContext.length > 0
        ? `<PORTION TO ANALYZE>\n${segment}\n\n<FOLLOWING CONTEXT>\n${followingContext}`
        : `<PORTION TO ANALYZE>\n${segment}`;
  } else if (index === segments.length - 1) {
    // Last segment: at least 1500 chars preceding, no following context
    const precedingContext = getContextFromSegments(segments, index - 1, 1500, 'backward');

    segmentWithContext =
      precedingContext.length > 0
        ? `<PRECEDING CONTEXT>\n${precedingContext}\n\n<PORTION TO ANALYZE>\n${segment}`
        : `<PORTION TO ANALYZE>\n${segment}`;
  } else {
    // Middle segments: at least 1000 chars before, at least 500 chars after
    const precedingContext = getContextFromSegments(segments, index - 1, 1000, 'backward');
    const followingContext = getContextFromSegments(segments, index + 1, 500, 'forward');

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
