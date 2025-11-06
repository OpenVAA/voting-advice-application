/**
 * Chatbot E2E Evaluation Script
 *
 * Runs promptfoo evaluation tests against the full chatbot pipeline.
 * Uses real API calls to LLMs and vector stores (no mocking).
 *
 * Usage: bun run src/scripts/chatbotEvaluation.ts
 */

import { setPromptVars } from '@openvaa/llm-refactor';
import { LLMProvider } from '@openvaa/llm-refactor';
import { MultiVectorStore, OpenAIEmbedder, routeQuery } from '@openvaa/vector-store';
import { config } from 'dotenv';
import { readFile } from 'fs/promises';
import { load as loadYaml } from 'js-yaml';
import { join } from 'path';
import { evaluate } from 'promptfoo';
import { ALL_CATEGORY_VALUES, isQueryable, type QueryCategory } from '../core/queryCategories';
import { loadPrompt } from '../utils/promptLoader';
import type { MultiVectorSearchResult } from '@openvaa/vector-store';
import type { ModelMessage } from 'ai';
import type { EvaluateTestSuite } from 'promptfoo';

// Load environment variables from project root
config({ path: join(__dirname, '..', '..', '..', '..', '.env') });
console.info('Getting Cohere API key from: ' + process.env.COHERE_API_KEY);

// Collection names for multi-vector retrieval
const COLLECTION_NAMES = {
  segments: 'eu-2024-segments',
  summaries: 'eu-2024-summaries',
  facts: 'eu-2024-facts'
} as const;

/**
 * Format RAG search results for LLM prompt
 */
function formatRAGContext(searchResult: MultiVectorSearchResult): string {
  if (searchResult.results.length === 0) {
    return 'No relevant context found.';
  }

  return searchResult.results
    .map((result) => {
      const source = result.segment.metadata.source || 'Unknown';
      return `### Source: ${source}\n${result.segment.segment}`;
    })
    .join('\n\n---\n\n');
}

/**
 * Promptfoo prompt function that replicates ChatbotController E2E flow
 *
 * This function:
 * 1. Initializes real infrastructure (vector store, LLM providers)
 * 2. Categorizes and reformulates query
 * 3. Retrieves RAG context if needed
 * 4. Loads system prompt and user query template
 * 5. Returns OpenAI message array
 */
export async function chatbotPromptFunction({ vars }: { vars: { query: string } }): Promise<Array<ModelMessage>> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  const query = vars.query as string;

  // Initialize embedder for vector store
  const embedder = new OpenAIEmbedder({
    model: 'text-embedding-3-small',
    dimensions: 1536,
    apiKey
  });

  // Initialize vector store
  const vectorStore = new MultiVectorStore({
    collectionNames: COLLECTION_NAMES,
    embedder,
    chromaPath: process.env.CHROMA_URL || 'http://localhost:8000'
  });

  // Initialize LLM provider for query routing
  const queryRoutingProvider = new LLMProvider({
    provider: 'openai',
    apiKey,
    modelConfig: {
      primary: 'gpt-4o-mini',
      useCachedInput: false
    }
  });

  // PHASE 1: Categorize and reformulate query
  console.info('\n--- PHASE 1: Query Routing ---');
  console.info('Original query:', query);
  const { category, rephrased } = await routeQuery({
    messages: [query],
    provider: queryRoutingProvider,
    categories: ALL_CATEGORY_VALUES
  });
  console.info('Category:', category);
  console.info('Rephrased:', rephrased || '(no reformulation)');
  console.info('Queryable:', isQueryable(category as QueryCategory));

  // PHASE 2: Retrieve RAG context if needed
  console.info('\n--- PHASE 2: RAG Retrieval ---');
  let ragContext = 'No relevant context found.';
  if (isQueryable(category as QueryCategory) && rephrased) {
    console.info('Searching vector store for:', rephrased);
    const searchResult = await vectorStore.search({
      query: rephrased,
      nResultsTarget: 10,
      searchCollections: ['segment', 'summary', 'fact'],
      searchConfig: {}
    });
    console.info(`Retrieved ${searchResult.results.length} results`);
    if (searchResult.results.length > 0) {
      console.info('Top result sources:');
      searchResult.results.slice(0, 3).forEach((result, idx) => {
        console.info(
          `  ${idx + 1}. ${result.segment.metadata.source} (score: ${result.vectorSearchScore?.toFixed(4)})`
        );
      });
    }
    ragContext = formatRAGContext(searchResult);
    console.info(`RAG context length: ${ragContext.length} chars`);
  } else {
    console.info('Skipping RAG retrieval (not queryable or no rephrased query)');
  }

  // PHASE 3: Load prompts
  console.info('\n--- PHASE 3: Loading Prompts ---');

  // Load system prompt using same approach as ChatEngine
  const systemPromptPath = join(__dirname, '..', 'core', 'prompts', 'systemPrompt_phases.yaml');
  console.info('Loading system prompt from:', systemPromptPath);
  const systemPromptRaw = await readFile(systemPromptPath, 'utf-8');
  const systemPromptParsed = loadYaml(systemPromptRaw) as {
    id: string;
    baseReminder: string;
    params?: Record<string, string>;
    basePrompt: string;
    phasePrompts: Record<string, string>;
  };

  // Compose system prompt: basePrompt + intent_resolution phase + baseReminder
  // Using intent_resolution phase since eval tests policy questions
  const basePrompt = systemPromptParsed.basePrompt || '';
  const phaseSpecific = systemPromptParsed.phasePrompts?.['intent_resolution'] || '';
  const baseReminder = systemPromptParsed.baseReminder || '';
  const systemPrompt = `${basePrompt}\n\n${phaseSpecific}\n\n${baseReminder}`;
  console.info('System prompt composed with phase: intent_resolution');
  console.info(`System prompt length: ${systemPrompt.length} chars`);

  const userQueryPrompt = await loadPrompt({ promptFileName: 'userQueryWithContext' });
  console.info('User query template loaded');

  // PHASE 4: Fill user query template with context + query
  const userMessage = setPromptVars({
    promptText: userQueryPrompt.prompt,
    variables: {
      context: ragContext,
      query
    },
    strict: true
  });

  // Return OpenAI message format
  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ];
}

async function runChatbotEvaluation(): Promise<void> {
  console.info('='.repeat(60));
  console.info('CHATBOT E2E EVALUATION');
  console.info('='.repeat(60));
  console.info('\nRunning evaluation with real API calls...\n');

  try {
    // Define test suite programmatically
    const testSuite: EvaluateTestSuite = {
      prompts: [chatbotPromptFunction],
      providers: ['openai:chat:gpt-4o-mini'],
      defaultTest: {
        options: {
          provider: 'openai:chat:gpt-4o-mini'
        }
      },
      tests: [
        {
          description: 'EU policy question triggers RAG retrieval and provides factual response',
          vars: {
            query: "What is the EPP's stance on migration?"
          },
          assert: [
            // Fast assertions - deterministic checks
            { type: 'contains', value: 'migration' },
            { type: 'javascript', value: 'output.length > 100' },
            { type: 'latency', threshold: 10000 },
            // Slow assertions - LLM-as-judge
            {
              type: 'llm-rubric',
              value: `The response must be:
- Factually accurate about EU political party positions
- Completely unbiased and neutral in tone
- Free from personal opinions or recommendations
- Based on provided context without hallucinations`
            },
            { type: 'answer-relevance', threshold: 0.8 }
          ]
        }
      ]
    };

    const results = await evaluate(testSuite);

    // Manually count successes and failures from results
    let successes = 0;
    let failures = 0;

    if (results.results && results.results.length > 0) {
      for (const result of results.results) {
        if (result.success) {
          successes++;
        } else {
          failures++;
        }
      }
    }

    // Print summary
    console.info('\n' + '='.repeat(60));
    console.info('EVALUATION RESULTS');
    console.info('='.repeat(60));
    console.info(`\nTotal tests: ${successes + failures}`);
    console.info(`Passed: ${successes}`);
    console.info(`Failed: ${failures}`);

    // Print detailed results
    if (results.results && results.results.length > 0) {
      console.info('\n' + '-'.repeat(60));
      for (const result of results.results) {        console.info(`\n${'='.repeat(60)}`);
        console.info(`Test: ${result.description || 'Unnamed test'}`);
        console.info(`Status: ${result.success ? '✅ PASS' : '❌ FAIL'}`);
        console.info(`${'='.repeat(60)}`);

        // Log response
        if (result.response) {
          console.info('\n--- RESPONSE ---');
          const responseText = typeof result.response === 'string' ? result.response : result.response.output;
          const fullText = typeof responseText === 'string' ? responseText : String(responseText);

          // Show full response for failed tests, truncated for passed tests
          if (!result.success) {
            console.info(fullText);
          } else {
            const preview = fullText.substring(0, 300);
            console.info(`${preview}${fullText.length > 300 ? '...' : ''}`);
          }
          console.info(`\nResponse length: ${fullText.length} chars`);
        } else {
          console.info('\n⚠️  No response data available');
        }

        // Log grading details
        if (result.gradingResult) {
          console.info('\n--- ASSERTIONS ---');
          const componentResults = result.gradingResult.componentResults || [];

          if (componentResults.length === 0) {
            console.info('⚠️  No assertion results found');
          }

          for (const assertion of componentResults) {
            const assertionType = assertion.assertion?.type || 'unknown';
            const assertionValue = assertion.assertion?.value || '';
            const status = assertion.pass ? '✅ PASS' : '❌ FAIL';

            console.info(`\n  ${status} - ${assertionType}`);

            if (assertionValue && assertionValue.toString().length < 100) {
              console.info(`    Value: ${assertionValue}`);
            }

            if (assertion.score !== undefined) {
              console.info(`    Score: ${assertion.score}`);
            }

            if (!assertion.pass) {
              if (assertion.reason) {
                console.info(`    Reason: ${assertion.reason}`);
              }
              if (assertion.comment) {
                console.info(`    Comment: ${assertion.comment}`);
              }
            }
          }

          // Log overall grading info if available
          if (result.gradingResult.pass !== undefined) {
            console.info(`\n  Overall grading pass: ${result.gradingResult.pass}`);
          }
          if (result.gradingResult.reason) {
            console.info(`  Overall reason: ${result.gradingResult.reason}`);
          }
        } else {
          console.info('\n⚠️  No grading result available');
        }

        // Log any error information
        if (result.error) {
          console.info('\n--- ERROR ---');
          console.info(result.error);
        }

        console.info('\n' + '-'.repeat(60));
      }
    }

    console.info('\n' + '='.repeat(60));
    console.info('EVALUATION COMPLETE');
    console.info('='.repeat(60));

    // Exit with appropriate code for CI
    if (failures > 0) {
      console.error(`\n❌ ${failures} test(s) failed`);
      process.exit(1);
    } else {
      console.info('\n✅ All tests passed');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ Evaluation failed:', error);
    process.exit(1);
  }
}

// Run the evaluation
runChatbotEvaluation().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
