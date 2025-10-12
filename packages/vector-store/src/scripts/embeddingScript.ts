import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { ChromaVectorStore } from '../core/chromaVectorStore';
import { OpenAIEmbedder } from '../core/openAIEmbedder';
import type { VectorStoreConfig } from '../core/vectorStore.type';
import type { DocProcessingResult } from './documentAnalysis';

dotenv.config({ path: path.join(__dirname, '..', '..', '..', '..', '.env') });

/** Vector stores' names. Albeit they use identical embedding model, we use different collections for modularity and easy usage */
const COLLECTION_NAMES = {
  segments: 'eu-2024-segments',
  summaries: 'eu-2024-summaries',
  facts: 'eu-2024-facts'
} as const;

/**
 * Multi-vector embedding script that:
 * 1. Reads DocProcessingResult JSON files from docs/step3_ready/
 * 2. Creates 3 separate ChromaDB collections (segments, summaries, facts)
 * 3. Embeds and stores each data type in its respective collection
 * 4. Maintains references for multi-vector retrieval
 */
export async function embedDocumentsMultiVector(): Promise<void> {
  const startTime = performance.now();
  const baseDir = path.join(__dirname, '..');
  const readyDir = path.join(baseDir, 'docs', 'step3_ready');

  console.info('Starting multi-vector embedding process...\n');

  // Check if ready directory exists
  if (!fs.existsSync(readyDir)) {
    throw new Error(`Ready docs directory not found: ${readyDir}\nPlease run the document analysis script first.`);
  }

  // Get all JSON files from the directory
  const readyFiles = fs.readdirSync(readyDir).filter((file) => file.endsWith('.json'));

  if (readyFiles.length === 0) {
    throw new Error(`No JSON files found in ${readyDir}\nPlease run the document analysis script first.`);
  }

  console.info(`Found ${readyFiles.length} document(s) to embed\n`);

  // Initialize embedder (shared across all collections)
  const embedder = new OpenAIEmbedder({
    model: 'text-embedding-3-small',
    dimensions: 1536,
    apiKey: process.env.OPENAI_API_KEY
  });

  // Initialize three separate vector stores
  const segmentsStore = new ChromaVectorStore({
    collectionName: COLLECTION_NAMES.segments,
    embedder
  } as VectorStoreConfig);

  const summariesStore = new ChromaVectorStore({
    collectionName: COLLECTION_NAMES.summaries,
    embedder
  } as VectorStoreConfig);

  const factsStore = new ChromaVectorStore({
    collectionName: COLLECTION_NAMES.facts,
    embedder
  } as VectorStoreConfig);

  // Initialize all collections
  console.info('Initializing vector stores...');
  await Promise.all([segmentsStore.initialize(), summariesStore.initialize(), factsStore.initialize()]);
  console.info('✓ All vector stores initialized\n');

  // Process each document
  let totalSegments = 0;
  let totalSummaries = 0;
  let totalFacts = 0;

  for (const readyFile of readyFiles) {
    const readyFilePath = path.join(readyDir, readyFile);

    try {
      console.info(`Processing: ${readyFile}`);

      // Read and parse the DocProcessingResult
      const fileContent = fs.readFileSync(readyFilePath, 'utf-8');
      const docResult: DocProcessingResult = JSON.parse(fileContent);

      // Validate document structure
      if (!docResult.fullDocument || !docResult.segments || !docResult.summaries || !docResult.facts) {
        console.error(`✗ Invalid DocProcessingResult structure in ${readyFile}`);
        continue;
      }

      console.info(`  - Document ID: ${docResult.fullDocument.id}`);
      console.info(`  - Segments: ${docResult.segments.length}`);
      console.info(`  - Summaries: ${docResult.summaries.length}`);
      console.info(`  - Facts: ${docResult.facts.length}`);

      // Embed and store in parallel
      console.info('  - Embedding and storing...');
      await Promise.all([
        segmentsStore.addTexts(docResult.segments),
        summariesStore.addSummaries(docResult.summaries),
        factsStore.addFacts(docResult.facts)
      ]);

      totalSegments += docResult.segments.length;
      totalSummaries += docResult.summaries.length;
      totalFacts += docResult.facts.length;

      console.info('✓ Successfully embedded and stored all data types\n');
    } catch (error) {
      console.error(`✗ Error processing ${readyFile}:`, error);
      continue;
    }
  }

  const endTime = performance.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.info('═══════════════════════════════════════');
  console.info('Multi-vector embedding complete!');
  console.info(`Total documents processed: ${readyFiles.length}`);
  console.info(`Total segments embedded: ${totalSegments}`);
  console.info(`Total summaries embedded: ${totalSummaries}`);
  console.info(`Total facts embedded: ${totalFacts}`);
  console.info(`Total time: ${duration} seconds`);
  console.info('═══════════════════════════════════════\n');
  console.info('Collections created:');
  console.info(`  - ${COLLECTION_NAMES.segments}`);
  console.info(`  - ${COLLECTION_NAMES.summaries}`);
  console.info(`  - ${COLLECTION_NAMES.facts}`);
}

// Run the embedding if this script is executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  embedDocumentsMultiVector()
    .then(() => {
      console.info('\nAll documents have been embedded and stored in ChromaDB');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error during embedding:', error);
      process.exit(1);
    });
}
