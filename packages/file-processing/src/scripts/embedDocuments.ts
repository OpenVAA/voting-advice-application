import { ChromaVectorStore, OpenAIEmbedder } from '@openvaa/vector-store';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { findJsonFiles } from './utils/embedding';
import type { ProcessPdfResult } from '../api.type';

// Load env vars
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '..', '.env') });

// Some constants
const COLLECTION_NAME = 'openvaa-eu-2024-elections';

/**
 * Embedding script that:
 * 1. Reads ProcessPdfResult JSON files from documents/step2_processed/
 * 2. Creates or reuses a ChromaDB collection
 * 3. Embeds and stores segments with their metadata
 *
 * This script will append to an existing collection if it already exists.
 */
export async function embedDocuments(): Promise<void> {
  const startTime = performance.now();
  const processedDir = path.join(__dirname, '../documents/step3_embeddingQueue');

  console.info('🚀 Starting embedding process...\n');

  // Check if processed directory exists
  if (!fs.existsSync(processedDir)) {
    throw new Error(
      `Processed docs directory not found: ${processedDir}\nPlease run the processDocuments script first.`
    );
  }

  // Get all JSON files from the directory and subdirectories
  const processedFiles = findJsonFiles(processedDir);

  if (processedFiles.length === 0) {
    throw new Error(`No JSON files found in ${processedDir}\nPlease run the processDocuments script first.`);
  }

  console.info(`📄 Found ${processedFiles.length} document(s) to embed\n`);

  // Initialize embedder
  const embedder = new OpenAIEmbedder({
    model: 'text-embedding-3-small',
    dimensions: 1536,
    apiKey: process.env.OPENAI_API_KEY
  });

  // Initialize vector store
  const vectorStore = new ChromaVectorStore({
    collectionName: COLLECTION_NAME,
    embedder
  });

  // Initialize collection (creates new or gets existing)
  console.info('Initializing vector store...');
  await vectorStore.initialize();
  console.info(`✓ Vector store initialized (collection: ${COLLECTION_NAME})\n`);

  // Process each document
  let totalSegments = 0;
  let totalFacts = 0;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < processedFiles.length; i++) {
    const processedFile = processedFiles[i];
    try {
      console.info(`[${i + 1}/${processedFiles.length}] Processing: ${processedFile.relativePath}`);

      // Read and parse the ProcessPdfResult
      const fileContent = fs.readFileSync(processedFile.fullPath, 'utf-8');
      const docResult: ProcessPdfResult = JSON.parse(fileContent);

      // Validate document structure
      if (!docResult.data?.segments) {
        console.error(`  ✗ Invalid ProcessPdfResult structure in ${processedFile.relativePath}`);
        errorCount++;
        continue;
      }

      const { segments, documentId, metadata } = docResult.data;

      // Calculate totals for logging
      const numSegments = segments.length;
      const numFacts = segments.reduce((sum, seg) => sum + (seg.standaloneFacts?.length || 0), 0);

      console.info(`  - Document ID: ${documentId}`);
      console.info(`  - Segments: ${numSegments}`);
      console.info(`  - Facts: ${numFacts}`);

      // Embed and store segments
      console.info('  - Embedding and storing...');
      await vectorStore.addSegments({
        segments,
        metadata
      });

      totalSegments += numSegments;
      totalFacts += numFacts;
      successCount++;

      console.info('  ✓ Successfully embedded and stored segments\n');
    } catch (error) {
      console.error(`  ✗ Error processing ${processedFile.relativePath}:`, error);
      errorCount++;
      continue;
    }
  }

  const endTime = performance.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.info('═══════════════════════════════════════');
  console.info('✅ Embedding complete!');
  console.info(`Documents processed: ${successCount}/${processedFiles.length}`);
  if (errorCount > 0) {
    console.info(`Errors: ${errorCount}`);
  }
  console.info(`Total segments embedded: ${totalSegments}`);
  console.info(`Total facts in segments: ${totalFacts}`);
  console.info(`Total time: ${duration} seconds`);
  console.info(`Collection: ${COLLECTION_NAME}`);
  console.info('═══════════════════════════════════════\n');
}

// Run the embedding if this script is executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  embedDocuments()
    .then(() => {
      console.info('✅ All documents have been embedded and stored in ChromaDB');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Fatal error during embedding:', error);
      process.exit(1);
    });
}
