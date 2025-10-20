import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { MultiVectorStore } from '../core/multiVectorStore';
import { OpenAIEmbedder } from '../core/openAIEmbedder';
import type { ProcessPdfResult } from '@openvaa/file-processing';

dotenv.config({ path: path.join(__dirname, '..', '..', '..', '..', '.env') });

/** Collection names for multi-vector retrieval */
const COLLECTION_NAMES = {
  segments: 'eu-2024-segments',
  summaries: 'eu-2024-summaries',
  facts: 'eu-2024-facts'
} as const;

/**
 * Recursively find all JSON files in a directory and its subdirectories
 */
function findJsonFiles(dir: string): Array<{ fullPath: string; relativePath: string }> {
  const results: Array<{ fullPath: string; relativePath: string }> = [];

  if (!fs.existsSync(dir)) {
    return results;
  }

  function searchDirectory(currentDir: string, relPath = '') {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const newRelPath = relPath ? path.join(relPath, entry.name) : entry.name;

      if (entry.isDirectory()) {
        searchDirectory(fullPath, newRelPath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.json')) {
        results.push({ fullPath, relativePath: newRelPath });
      }
    }
  }

  searchDirectory(dir);
  return results;
}

/**
 * Multi-vector embedding script that:
 * 1. Reads ProcessPdfResult JSON files from docs/step3_ready/
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

  // Get all JSON files from the directory and subdirectories
  const readyFiles = findJsonFiles(readyDir);

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

  // Initialize multi-vector store (manages all three collections)
  const vectorStore = new MultiVectorStore({
    collectionNames: COLLECTION_NAMES,
    embedder
  });

  // Initialize all collections
  console.info('Initializing multi-vector store...');
  await vectorStore.initialize();
  console.info('✓ Multi-vector store initialized\n');

  // Process each document
  let totalSegments = 0;
  let totalSummaries = 0;
  let totalFacts = 0;

  for (const readyFile of readyFiles) {
    try {
      console.info(`Processing: ${readyFile.relativePath}`);

      // Read and parse the ProcessPdfResult
      const fileContent = fs.readFileSync(readyFile.fullPath, 'utf-8');
      const docResult: ProcessPdfResult = JSON.parse(fileContent);

      // Validate document structure
      if (!docResult.data?.segmentAnalyses) {
        console.error(`✗ Invalid ProcessPdfResult structure in ${readyFile.relativePath}`);
        continue;
      }

      const { segmentAnalyses, documentId, metadata } = docResult.data;

      // Calculate totals for logging
      const numSegments = segmentAnalyses.length;
      const numSummaries = segmentAnalyses.length; // Each segment has a summary
      const numFacts = segmentAnalyses.reduce((sum, analysis) => sum + (analysis.standaloneFacts?.length || 0), 0);

      console.info(`  - Document ID: ${documentId}`);
      console.info(`  - Segments: ${numSegments}`);
      console.info(`  - Summaries: ${numSummaries}`);
      console.info(`  - Facts: ${numFacts}`);

      // Embed and store using simplified API
      console.info('  - Embedding and storing...');
      await vectorStore.addAnalyzedSegments(segmentAnalyses, documentId, metadata);

      totalSegments += numSegments;
      totalSummaries += numSummaries;
      totalFacts += numFacts;

      console.info('✓ Successfully embedded and stored all data types\n');
    } catch (error) {
      console.error(`✗ Error processing ${readyFile.relativePath}:`, error);
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
