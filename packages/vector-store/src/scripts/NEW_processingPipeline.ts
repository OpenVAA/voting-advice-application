import { processPdf } from '@openvaa/file-processing';
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
 * Find all PDF files in subdirectories
 */
function findPDFs(dir: string): Array<{ path: string; subdirectory: string; filename: string }> {
  const results: Array<{ path: string; subdirectory: string; filename: string }> = [];

  if (!fs.existsSync(dir)) {
    console.warn(`Directory not found: ${dir}`);
    return results;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Search subdirectory
      const subdirectoryName = entry.name;
      const subEntries = fs.readdirSync(fullPath, { withFileTypes: true });

      for (const subEntry of subEntries) {
        if (subEntry.isFile() && subEntry.name.toLowerCase().endsWith('.pdf')) {
          results.push({
            path: path.join(fullPath, subEntry.name),
            subdirectory: subdirectoryName,
            filename: subEntry.name
          });
        }
      }
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.pdf')) {
      results.push({
        path: fullPath,
        subdirectory: 'root',
        filename: entry.name
      });
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
  console.info('🚀 Starting PDF Processing Pipeline\n');

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
      primary: 'gemini-2.5-flash-preview-09-2025'
    }
  });

  // Find all PDFs
  const pdfs = findPDFs(UNPROCESSED_DIR);
  console.info(`📄 Found ${pdfs.length} PDF(s) to process\n`);

  if (pdfs.length === 0) {
    console.info('No PDFs found. Exiting.');
    return;
  }

  // Process each PDF
  for (let i = 0; i < pdfs.length; i++) {
    const pdf = pdfs[i];
    console.info(`\n[${i + 1}/${pdfs.length}] Processing: ${pdf.filename}`);
    console.info(`  Subdirectory: ${pdf.subdirectory}`);

    try {
      // Read PDF file
      const pdfBuffer = fs.readFileSync(pdf.path);

      // Process the PDF through the complete pipeline
      const result = await processPdf({
        pdfBuffer,
        apiKey: process.env.GEMINI_API_KEY,
        model: 'gemini-2.5-pro',
        originalFileName: pdf.filename,
        llmProvider,
        documentId: `${pdf.subdirectory}_${path.parse(pdf.filename).name}`,
        runId: `pipeline_${Date.now()}`
      });

      if (!result.success) {
        console.error(`  ✗ Failed to process ${pdf.filename}`);
        continue;
      }

      // Generate output filenames
      const baseFilename = path.parse(pdf.filename).name;
      const subdir = pdf.subdirectory === 'root' ? '' : `${pdf.subdirectory}_`;

      // Save readable segments
      const segmentsPath = path.join(SEGMENTED_TEXT_JOINED, `${subdir}${baseFilename}_segments.txt`);
      saveSegmentsToFile(result.data.segmentAnalyses, segmentsPath);

      // Save complete JSON result
      const jsonPath = path.join(OUTPUT_DIR, `${subdir}${baseFilename}_processed.json`);
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
      console.error(`  ✗ Error processing ${pdf.filename}:`, error);
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
