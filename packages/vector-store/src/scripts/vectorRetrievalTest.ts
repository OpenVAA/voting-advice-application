import { LLMProvider } from '@openvaa/llm-refactor';
import dotenv from 'dotenv';
import * as path from 'path';
import { ChromaVectorStore } from '../core/chromaVectorStore';
import { OpenAIEmbedder } from '../core/openAIEmbedder';
import { getQueryVariations, isRAGRequired } from '../core/utils';
import type { VectorStoreConfig } from '../core/vectorStore.type';

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
  console.info('═══════════════════════════════════════');
  console.info('Multi-Vector Retrieval Test');
  console.info('═══════════════════════════════════════\n');
  console.info(`Query: "${query}"`);
  console.info(`Top K per collection: ${topKPerCollection}`);
  console.info(`Intelligent Search: ${intelligentSearch ? 'ENABLED' : 'DISABLED'}\n`);

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
    modelConfig: { primary: 'IRRELEVANT' }
  });

  // Check if RAG is required for this query
  console.info('Checking if RAG retrieval is needed...');
  const needsRAG = await isRAGRequired({
    messages: [query], // In a real conversation, this would be the full message history
    provider: binaryProvider,
    modelConfig: { primary: 'gpt-5-nano' }
  });

  console.info(`RAG required: ${needsRAG ? 'YES' : 'NO'}\n`);

  if (!needsRAG) {
    console.info('Skipping RAG search - query does not require retrieval.');
    console.info('═══════════════════════════════════════\n');
    return;
  }

  // Initialize LLM provider (only if intelligent search is enabled)
  const llmProvider = intelligentSearch
    ? new LLMProvider({
        provider: 'google',
        apiKey: process.env.LLM_GEMINI_API_KEY || '',
        modelConfig: { primary: 'i probably shouldnt be here' }
      })
    : undefined;
  const actualModelConfig = intelligentSearch ? { primary: 'gemini-2.5-flash-preview-09-2025' } : undefined;

  // Create a vector store instance
  const vectorStore = new ChromaVectorStore({
    collectionName: COLLECTION_NAMES.segments,
    embedder
  } as VectorStoreConfig);

  await vectorStore.initialize();

  console.info('Searching across all collections...\n');

  const startTime = performance.now();

  // Perform multi-vector search
  const results = await vectorStore.multiVectorSearch(query, {
    segmentsCollectionName: COLLECTION_NAMES.segments,
    summariesCollectionName: COLLECTION_NAMES.summaries,
    factsCollectionName: COLLECTION_NAMES.facts,
    topKPerCollection,
    getQueryVariations,
    llmProvider,
    llmModelConfig: actualModelConfig,
    intelligentSearch
  });

  const endTime = performance.now();
  const duration = ((endTime - startTime) / 1000).toFixed(3);

  console.info('═══════════════════════════════════════');
  console.info('Results:');
  console.info('═══════════════════════════════════════\n');
  console.info(`Total unique segments retrieved: ${results.segments.length}`);
  console.info(`  - From segments collection: ${results.retrievalSources.fromSegments}`);
  console.info(`  - From summaries collection: ${results.retrievalSources.fromSummaries}`);
  console.info(`  - From facts collection: ${results.retrievalSources.fromFacts}`);
  console.info(`  - Total costs: $${llmProvider?.cumulativeCosts.toFixed(4)}`);
  console.info(`Search duration: ${duration}s\n\n`);

  results.segments.forEach((segment, idx) => {
    console.info(`Segment ${idx + 1}:`);
    console.info(`   \n\n${segment.content}\n`);
    console.info('');
  });

  console.info('═══════════════════════════════════════\n');
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
