import { BaseController } from '@openvaa/core';
import { LLMProvider } from '@openvaa/llm-refactor';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { findDocuments, saveSegmentsToFile } from './utils/processing';
import { processPdf, processText } from '../api';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '..', '.env') });

// Directories
const UNPROCESSED_DIR = path.join(__dirname, '../documents/step0_raw/');
const SEGMENTED_TEXT_JOINED = path.join(__dirname, '../documents/step1_segmented');
const OUTPUT_DIR = path.join(__dirname, '../documents/step2_processed');

// --------------------------------------------------------------
// MAIN PROCESSING
// --------------------------------------------------------------

async function main() {
  console.info('🚀 Starting Document Processing Pipeline\n');

  // Ensure output directories exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  if (!fs.existsSync(SEGMENTED_TEXT_JOINED)) {
    fs.mkdirSync(SEGMENTED_TEXT_JOINED, { recursive: true });
  }

  // Initialize LLM Provider
  const llmProvider = new LLMProvider({
    provider: 'google',
    apiKey: process.env.LLM_GEMINI_API_KEY!,
    modelConfig: {
      primary: 'gemini-2.5-flash-preview-09-2025',
      fallback: 'gemini-2.5-pro' // not used but doesn't hurt for future
    }
  });

  // Find all documents
  const documents = findDocuments(UNPROCESSED_DIR);
  console.info(`📄 Found ${documents.length} document(s) to process\n`);

  if (documents.length === 0) {
    console.info('No documents found. Exiting.');
    return;
  }

  // Process each document
  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    console.info(`\n[${i + 1}/${documents.length}] Processing: ${doc.filename} (${doc.fileType.toUpperCase()})`);
    console.info(`  Subdirectory: ${doc.subdirectory}`);

    try {
      let result;

      if (doc.fileType === 'pdf') {
        // Read PDF file as buffer
        const pdfBuffer = fs.readFileSync(doc.path);

        // Process the PDF through the complete pipeline
        const docIdPrefix = doc.subdirectory === 'root' ? '' : `${doc.subdirectory.replace(/\//g, '_')}_`;
        result = await processPdf({
          pdfBuffer,
          apiKey: process.env.LLM_GEMINI_API_KEY,
          model: 'gemini-2.5-pro',
          originalFileName: doc.filename,
          llmProvider,
          documentId: `${docIdPrefix}${path.parse(doc.filename).name}`,
          runId: `pipeline_${Date.now()}`,
          controller: new BaseController()
        });
      } else {
        // Read TXT file as text
        const text = fs.readFileSync(doc.path, 'utf-8');

        // Process the text directly (treating as markdown)
        const docIdPrefix = doc.subdirectory === 'root' ? '' : `${doc.subdirectory.replace(/\//g, '_')}_`;
        result = await processText({
          text,
          llmProvider,
          documentId: `${docIdPrefix}${path.parse(doc.filename).name}`,
          runId: `pipeline_${Date.now()}`,
          controller: new BaseController()
        });
      }

      if (!result.success) {
        console.error(`  ✗ Failed to process ${doc.filename}`);
        continue;
      }

      // Extract top-level category (official/unofficial) from subdirectory path
      const topLevelCategory = doc.subdirectory === 'root' ? null : doc.subdirectory.split(path.sep)[0];
      const baseFilename = path.parse(doc.filename).name;

      // Create category subdirectories in output folders if needed
      if (topLevelCategory) {
        const segmentsSubdirPath = path.join(SEGMENTED_TEXT_JOINED, topLevelCategory);
        const jsonSubdirPath = path.join(OUTPUT_DIR, topLevelCategory);

        if (!fs.existsSync(segmentsSubdirPath)) {
          fs.mkdirSync(segmentsSubdirPath, { recursive: true });
        }
        if (!fs.existsSync(jsonSubdirPath)) {
          fs.mkdirSync(jsonSubdirPath, { recursive: true });
        }
      }

      // Build output paths (with or without category subdirectory)
      const segmentsPath = topLevelCategory
        ? path.join(SEGMENTED_TEXT_JOINED, topLevelCategory, `${baseFilename}_segments.txt`)
        : path.join(SEGMENTED_TEXT_JOINED, `${baseFilename}_segments.txt`);

      const jsonPath = topLevelCategory
        ? path.join(OUTPUT_DIR, topLevelCategory, `${baseFilename}_processed.json`)
        : path.join(OUTPUT_DIR, `${baseFilename}_processed.json`);

      // Save readable segments
      saveSegmentsToFile(result.data.segments, segmentsPath);

      // Save complete JSON result
      fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf-8');
      console.info(`  ✓ Saved full result to: ${jsonPath}`);

      // Print processing stats
      console.info('\n  📊 Processing Stats:');
      console.info(`    - Segments: ${result.data.segments.length}`);
      console.info(`    - Total cost: $${result.llmMetrics.costs.total.toFixed(4)}`);
      console.info(`    - Processing time: ${(result.llmMetrics.processingTimeMs / 1000).toFixed(2)}s`);
      console.info(`    - LLM calls: ${result.llmMetrics.nLlmCalls}`);
      console.info(`    - Total tokens: ${result.llmMetrics.tokens.totalTokens}`);
    } catch (error) {
      console.error(`  ✗ Error processing ${doc.filename}:`, error);
      continue;
    }
  }

  console.info('\n✅ Pipeline complete!');
}

// Run the pipeline
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
