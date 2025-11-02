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
import { join } from 'path';
import { evaluate } from 'promptfoo';
import { ALL_CATEGORY_VALUES, isQueryable } from '../core/queryCategories';
import { loadPrompt } from '../utils/promptLoader';
import type { MultiVectorSearchResult } from '@openvaa/vector-store';
import type { EvaluateTestSuite, PromptFunction } from 'promptfoo';

// Load environment variables from project root
config({ path: join(__dirname, '..', '..', '..', '..', '.env') });

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
const chatbotPromptFunction: PromptFunction = async ({ vars }) => {
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
  const { category, rephrased } = await routeQuery({
    messages: [query],
    provider: queryRoutingProvider,
    categories: ALL_CATEGORY_VALUES
  });

  // PHASE 2: Retrieve RAG context if needed
  let ragContext = 'No relevant context found.';
  if (isQueryable(category as any) && rephrased) {
    const searchResult = await vectorStore.search({
      query: rephrased,
      nResultsTarget: 10,
      searchCollections: ['segment', 'summary', 'fact'],
      searchConfig: {}
    });
    ragContext = formatRAGContext(searchResult);
  }

  // PHASE 3: Load prompts
  const systemPrompt = await loadPrompt({ promptFileName: 'systemPrompt_v0' });
  const userQueryPrompt = await loadPrompt({ promptFileName: 'userQueryWithContext' });

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
    { role: 'system', content: systemPrompt.prompt },
    { role: 'user', content: userMessage }
  ];
};

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
      for (const result of results.results) {
        console.info(`\nTest: ${result.description || 'Unnamed test'}`);
        console.info(`Status: ${result.success ? 'PASS' : 'FAIL'}`);

        if (result.gradingResult) {
          console.info('\nAssertions:');
          for (const assertion of result.gradingResult.componentResults || []) {
            console.info(`  - ${assertion.assertion?.type}: ${assertion.pass ? 'PASS' : 'FAIL'}`);
            if (!assertion.pass && assertion.reason) {
              console.info(`    Reason: ${assertion.reason}`);
            }
          }
        }

        if (result.response) {
          // Handle response which can be a string or ProviderResponse object
          const responseText = typeof result.response === 'string' ? result.response : result.response.output;
          const preview = typeof responseText === 'string' ? responseText.substring(0, 200) : String(responseText);
          console.info(`\nResponse preview: ${preview}...`);
        }
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
