import { BaseController } from '@openvaa/core';
import { processPdf, processText } from '@openvaa/file-processing';
import { LLMProvider } from '@openvaa/llm-refactor';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '..', '.env') });

// Directories
const UNPROCESSED_DIR = path.join(__dirname, '../docs/step0_unprocessed');
const OUTPUT_DIR = path.join(__dirname, '../docs/step3_ready');
const SEGMENTED_TEXT_JOINED = path.join(__dirname, '../docs/NEW_segmentedTexts');

// --------------------------------------------------------------
// HELPERS
// --------------------------------------------------------------

/**
 * Find all document files (.pdf and .txt) recursively in subdirectories
 */
function findDocuments(
  dir: string,
  relativePath = ''
): Array<{ path: string; subdirectory: string; filename: string; fileType: 'pdf' | 'txt' }> {
  const results: Array<{ path: string; subdirectory: string; filename: string; fileType: 'pdf' | 'txt' }> = [];

  if (!fs.existsSync(dir)) {
    console.warn(`Directory not found: ${dir}`);
    return results;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const newRelativePath = relativePath ? path.join(relativePath, entry.name) : entry.name;

    if (entry.isDirectory()) {
      // Recursively search subdirectories
      results.push(...findDocuments(fullPath, newRelativePath));
    } else if (entry.isFile()) {
      const lowerName = entry.name.toLowerCase();
      let fileType: 'pdf' | 'txt' | null = null;

      if (lowerName.endsWith('.pdf')) {
        fileType = 'pdf';
      } else if (lowerName.endsWith('.txt')) {
        fileType = 'txt';
      }

      if (fileType) {
        results.push({
          path: fullPath,
          subdirectory: relativePath || 'root',
          filename: entry.name,
          fileType
        });
      }
    }
  }

  return results;
}

/**
 * Save segments to a readable text file with double line separations
 */
function saveSegmentsToFile(
  segments: Array<{ segment: string; segmentIndex: number; summary?: string }>,
  outputPath: string
): void {
  const content = segments
    .map((seg) => {
      const header = `=== SEGMENT ${seg.segmentIndex + 1} ===`;
      const summarySection = seg.summary ? `\n[Summary: ${seg.summary}]\n` : '';
      return `${header}${summarySection}\n${seg.segment}`;
    })
    .join('\n\n\n'); // Two line separations between segments

  fs.writeFileSync(outputPath, content, 'utf-8');
  console.info(`  ✓ Saved readable segments to: ${outputPath}`);
}

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
      saveSegmentsToFile(result.data.segmentAnalyses, segmentsPath);

      // Save complete JSON result
      fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf-8');
      console.info(`  ✓ Saved full result to: ${jsonPath}`);

      // Print processing stats
      console.info('\n  📊 Processing Stats:');
      console.info(`    - Segments: ${result.data.segmentAnalyses.length}`);
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
