import { LLMProvider } from '@openvaa/llm-refactor';
import dotenv from 'dotenv';
import * as path from 'path';
import { MultiVectorStore } from '../core/multiVectorStore';
import { OpenAIEmbedder } from '../core/openAIEmbedder';
import { getQueryVariations, isRAGRequired } from '../core/utils';

dotenv.config({ path: path.join(__dirname, '..', '..', '..', '..', '.env') });

const COLLECTION_NAMES = {
  segments: 'eu-2024-segments',
  summaries: 'eu-2024-summaries',
  facts: 'eu-2024-facts'
} as const;

/**
 * Test multi-vector retrieval
 * Demonstrates how the multi-vector search works across all three collections
 */
export async function testMultiVectorRetrieval(
  query: string,
  topKPerCollection: number = 3,
  intelligentSearch: boolean = false
): Promise<void> {
  console.info('\n\n═══════════════════════════════════════');
  console.info('Multi-Vector Retrieval Test');
  console.info('═══════════════════════════════════════\n\n');
  console.info('          STEP 1: Basic Information\n\n');
  console.info(`  - Query: "${query}"\n`);
  console.info(`  - Top K per collection: ${topKPerCollection}\n`);
  console.info(`  - Intelligent Search: ${intelligentSearch ? 'ENABLED' : 'DISABLED'}`);

  // Initialize embedder
  const embedder = new OpenAIEmbedder({
    model: 'text-embedding-3-small',
    dimensions: 1536,
    apiKey: process.env.OPENAI_API_KEY
  });

  // Initialize binary decision provider (always OpenAI for fast, cheap decisions)
  const binaryProvider = new LLMProvider({
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY || '',
    modelConfig: { primary: 'gpt-4o-mini' }
  });

  // Check if RAG is required for this query
  console.info('\n\n\n          STEP 2: Checking if RAG retrieval is needed...\n\n');
  console.info('  - Checking if RAG retrieval is needed...');
  const needsRAG = await isRAGRequired({
    messages: [query], // In a real conversation, this would be the full message history
    provider: binaryProvider,
    modelConfig: { primary: 'gpt-5-nano' }
  });

  console.info(`  - RAG required: ${needsRAG ? 'YES' : 'NO'}\n`);

  if (!needsRAG) {
    console.info('  - Skipping RAG search - query does not require retrieval.');
    console.info('  - Total cost: $' + binaryProvider.cumulativeCosts.toFixed(4));
    console.info('═══════════════════════════════════════\n');
    return;
  }

  // Initialize LLM provider (only if intelligent search is enabled)
  const llmProvider = intelligentSearch
    ? new LLMProvider({
        provider: 'google',
        apiKey: process.env.LLM_GEMINI_API_KEY || '',
        modelConfig: { primary: 'gemini-2.0-flash-exp' }
      })
    : undefined;

  // Create a MultiVectorStore instance
  const multiVectorStore = new MultiVectorStore({
    collectionNames: COLLECTION_NAMES,
    embedder
  });

  await multiVectorStore.initialize();

  const startTime = performance.now();

  // Perform multi-vector search
  const searchResults = await multiVectorStore.search({
    query,
    searchCollections: ['segment', 'summary', 'fact'],
    searchConfig: {
      segment: { topK: topKPerCollection, maxResults: topKPerCollection, minSimilarity: 0.3 },
      summary: { topK: topKPerCollection, maxResults: topKPerCollection, minSimilarity: 0.3 },
      fact: { topK: topKPerCollection, maxResults: topKPerCollection, minSimilarity: 0.5 }
    },
    getQueryVariations,
    llmProvider,
    intelligentSearch
  });

  const endTime = performance.now();
  const duration = ((endTime - startTime) / 1000).toFixed(3);

  console.info('\n\n\n          STEP 3: Segments \n\n');
  searchResults.results.forEach((result, idx) => {
    console.info('\n\n═══════════════════════════════════════\n\n');
    console.info(`Segment ${idx + 1} (score: ${result.score.toFixed(3)}, found via: ${result.foundWith}):`);
    console.info(`   \n\n${result.segment.segment}\n`);
    if (result.segment.summary) {
      console.info(`  - SUMMARY: ${result.segment.summary}\n`);
    }
    if (result.segment.standaloneFacts && result.segment.standaloneFacts.length > 0) {
      console.info(`  - FACTS: ${result.segment.standaloneFacts.join('\n')}\n`);
    }
    console.info('\n\n═══════════════════════════════════════\n\n');
  });

  console.info('\n\n\n          STEP 4: Statistics\n\n');
  console.info(`  - Total unique segments retrieved: ${searchResults.results.length}`);
  console.info(`  - From segments collection: ${searchResults.retrievalSources.fromSegments}`);
  console.info(`  - From summaries collection: ${searchResults.retrievalSources.fromSummaries}`);
  console.info(`  - From facts collection: ${searchResults.retrievalSources.fromFacts}`);
  console.info(`  - Total costs: $${((llmProvider?.cumulativeCosts ?? 0) + binaryProvider.cumulativeCosts).toFixed(4)}`);
  console.info(`  - Search duration: ${duration}s\n\n`);
}

// Run the test if this script is executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  const args = process.argv.slice(2);

  // Parse flags
  let intelligentSearch = false;
  const nonFlagArgs = args.filter((arg) => {
    if (arg === '--intelligent' || arg === '--i') {
      intelligentSearch = true;
      return false;
    }
    return true;
  });

  if (nonFlagArgs.length === 0) {
    console.error('Usage: tsx vectorRetrievalTest.ts "your query here" [topK] [--intelligent|--i]');
    console.error('Example: tsx vectorRetrievalTest.ts "What is the voting age in EU?" 3 --intelligent');
    process.exit(1);
  }

  const query = nonFlagArgs[0];
  const topK = nonFlagArgs[1] ? parseInt(nonFlagArgs[1]) : 3;

  testMultiVectorRetrieval(query, topK, intelligentSearch)
    .then(() => {
      console.info('Test complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error during retrieval test:', error);
      process.exit(1);
    });
}
