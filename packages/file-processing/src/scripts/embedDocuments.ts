import { ChromaVectorStore, OpenAIEmbedder } from '@openvaa/vector-store';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { findJsonFiles } from './utils/embedding';
import type { ProcessPdfResult } from '../api.type';

// Load env vars
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '..', '.env') });

// Some constants
const COLLECTION_NAME = 'eu-2024-election-chatbot';

/**
 * Parse command-line arguments for filename filtering
 */
function parseArgs(): { filenames: Array<string> } {
  const args = process.argv.slice(2);
  const filenames: Array<string> = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--filenames' || args[i] === '--f') {
      // Collect all following arguments until the next flag or end
      i++;
      while (i < args.length && !args[i].startsWith('--')) {
        filenames.push(args[i]);
        i++;
      }
      i--; // Back up one since the for loop will increment
    }
  }

  return { filenames };
}

/**
 * Filter files based on provided filenames
 * Matches against the base filename (without path or extension)
 */
function filterFilesByNames(
  files: Array<{ fullPath: string; relativePath: string }>,
  filenames: Array<string>
): Array<{ fullPath: string; relativePath: string }> {
  if (filenames.length === 0) return files;

  return files.filter((file) => {
    const baseName = path.basename(file.relativePath, path.extname(file.relativePath));
    // Also try matching without the '_processed' suffix
    const baseNameWithoutSuffix = baseName.replace(/_processed$/, '');

    return filenames.some((filterName) => {
      const filterBase = filterName.replace(/\.(json|pdf|txt)$/i, '').replace(/_processed$/, '');
      return baseName === filterBase || baseNameWithoutSuffix === filterBase || baseName.includes(filterBase);
    });
  });
}

/**
 * Embedding script that:
 * 1. Reads ProcessPdfResult JSON files from documents/step3_embeddingQueue/
 * 2. Creates or reuses a ChromaDB collection
 * 3. Embeds and stores segments with their metadata
 *
 * This script will append to an existing collection if it already exists.
 *
 * Usage:
 *   - Process all files: node embedDocuments.js
 *   - Process specific files: node embedDocuments.js --filenames doc1 doc2
 *   - Or use --f: node embedDocuments.js --f doc1
 */
export async function embedDocuments(): Promise<void> {
  const startTime = performance.now();
  const processedDir = path.join(__dirname, '../documents/step3_embeddingQueue');

  // Parse command-line arguments
  const { filenames } = parseArgs();

  console.info('🚀 Starting embedding process...\n');

  if (filenames.length > 0) {
    console.info(`📌 Filtering for specific files: ${filenames.join(', ')}\n`);
  }

  // Check if processed directory exists
  if (!fs.existsSync(processedDir)) {
    throw new Error(
      `Processed docs directory not found: ${processedDir}\nPlease run the processDocuments script first.`
    );
  }

  // Get all JSON files from the directory and subdirectories
  let processedFiles = findJsonFiles(processedDir);

  // Filter by filenames if provided
  if (filenames.length > 0) {
    const originalCount = processedFiles.length;
    processedFiles = filterFilesByNames(processedFiles, filenames);
    console.info(`📄 Found ${processedFiles.length} matching document(s) out of ${originalCount} total\n`);

    if (processedFiles.length === 0) {
      console.warn('⚠️  No files matched the provided filenames. Available files:');
      const allFiles = findJsonFiles(processedDir);
      allFiles.forEach((f) => console.info(`  - ${f.relativePath}`));
      return;
    }
  } else {
    console.info(`📄 Found ${processedFiles.length} document(s) to embed\n`);
  }

  if (processedFiles.length === 0) {
    throw new Error(`No JSON files found in ${processedDir}\nPlease run the processDocuments script first.`);
  }

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
  const failedDocuments: Array<{ path: string; error: string }> = [];

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

      const { segments, metadata } = docResult.data;

      // Calculate totals for logging
      const numSegments = segments.length;
      const numFacts = segments.reduce((sum, seg) => sum + (seg.standaloneFacts?.length || 0), 0);

      // Embed and store segments
      console.info('  - Embedding and storing...');
      await vectorStore.addSegments({
        segments,
        metadata
      });

      totalSegments += numSegments;
      totalFacts += numFacts;
      successCount++;

      console.info('  ✓ Successfully embedded and stored segments');

      // Delete the successfully processed file from embedding queue
      fs.unlinkSync(processedFile.fullPath);
      console.info('  🗑️  Removed processed file from queue\n');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`  ✗ Error processing ${processedFile.relativePath}:`, error);
      failedDocuments.push({
        path: processedFile.relativePath,
        error: errorMessage
      });
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
    console.info('\n❌ Failed documents:');
    failedDocuments.forEach((doc) => {
      console.info(`  - ${doc.path}`);
      console.info(`    Error: ${doc.error}`);
    });
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
