import { convertPdfToMarkdown, processDocument } from '@openvaa/file-processing';
import { LLMProvider } from '@openvaa/llm-refactor';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import type { DocumentProcessingResult } from '@openvaa/file-processing';
import type { SegmentWithAnalysis } from '../core/types';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '..', '.env') });

// Directories
const UNPROCESSED_DIR = path.join(__dirname, '../docs/step0_unprocessed');
const OUTPUT_DIR = path.join(__dirname, '../docs/step3_ready');

/** Old format expected by vector store */
interface VectorStoreDocument {
  fullDocument: {
    id: string;
    content: string;
    metadata: {
      title?: string;
      source?: string;
      authors?: Array<string>;
      publishedDate?: string;
      locale?: string;
    };
  };
  segments: Array<{
    id: string;
    parentDocId: string;
    segmentIndex: number;
    content: string;
    metadata: {
      title?: string;
      source?: string;
      authors?: Array<string>;
      publishedDate?: string;
      locale?: string;
    };
  }>;
  summaries: Array<{
    id: string;
    parentDocId: string;
    segmentIndex: number;
    content: string;
  }>;
  facts: Array<{
    id: string;
    parentDocId: string;
    segmentIndex: number;
    content: string;
  }>;
}

/**
 * Transform the file-processing API result to the vector store format
 */
function transformToVectorStoreFormat(result: DocumentProcessingResult, markdownContent: string): VectorStoreDocument {
  const { documentId, metadata, segmentAnalyses } = result;

  // Build the full document
  const fullDocument = {
    id: documentId,
    content: markdownContent,
    metadata
  };

  // Build segments array
  const segments = segmentAnalyses.map((analysis: SegmentWithAnalysis) => ({
    id: analysis.id,
    parentDocId: analysis.parentDocId,
    segmentIndex: analysis.segmentIndex,
    content: analysis.segment,
    metadata
  }));

  // Build summaries array
  const summaries = segmentAnalyses.map((analysis: SegmentWithAnalysis) => ({
    id: `${analysis.id}_summary`,
    parentDocId: analysis.parentDocId,
    segmentIndex: analysis.segmentIndex,
    content: analysis.summary
  }));

  // Build facts array from standaloneFacts
  const facts: Array<{
    id: string;
    parentDocId: string;
    segmentIndex: number;
    content: string;
  }> = [];

  segmentAnalyses.forEach((analysis: SegmentWithAnalysis) => {
    if (analysis.standaloneFacts && analysis.standaloneFacts.length > 0) {
      analysis.standaloneFacts.forEach((fact, factIndex) => {
        facts.push({
          id: `${analysis.id}_fact_${factIndex}`,
          parentDocId: analysis.parentDocId,
          segmentIndex: analysis.segmentIndex,
          content: fact
        });
      });
    }
  });

  return {
    fullDocument,
    segments,
    summaries,
    facts
  };
}

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
 * Process a single PDF: convert to markdown, segment, and analyze
 */
async function processPDF(
  pdfPath: string,
  filename: string,
  llmProvider: LLMProvider,
  modelConfig: { primary: string }
): Promise<VectorStoreDocument | null> {
  try {
    console.info(`\n[1/3] Converting PDF to Markdown: ${filename}`);

    // Step 1: Convert PDF to Markdown
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfResult = await convertPdfToMarkdown({
      pdfBuffer,
      apiKey: process.env.LLM_GEMINI_API_KEY || '',
      model: 'gemini-2.0-flash-exp',
      originalFileName: filename
    });

    const markdownContent = pdfResult.markdown;
    console.info(`  ✓ Converted to markdown (${markdownContent.length} chars)`);
    console.info(`  ✓ Cost: $${pdfResult.metadata.costs.total.toFixed(4)}`);

    // Step 2: Process document (segment and analyze)
    console.info('[2/3] Segmenting and analyzing document...');
    const baseName = path.basename(filename, '.pdf');
    const documentId = `${baseName}_${crypto.randomUUID()}`;

    const analysisResult = await processDocument({
      text: markdownContent,
      llmProvider,
      modelConfig,
      documentId,
      validateTextPreservation: true
    });

    console.info(`  ✓ Created ${analysisResult.processingMetadata.segmentsAnalyzed} segments`);
    console.info(`  ✓ Generated ${analysisResult.processingMetadata.summariesGenerated} summaries`);
    console.info(`  ✓ Extracted ${analysisResult.processingMetadata.factsExtracted} facts`);
    console.info(`  ✓ Cost: $${analysisResult.processingMetadata.costs.total.toFixed(4)}`);
    console.info(`  ✓ Processing time: ${(analysisResult.processingMetadata.processingTimeMs / 1000).toFixed(2)}s`);

    // Step 3: Transform to vector store format
    console.info('[3/3] Transforming to vector store format...');
    const vectorStoreDocument = transformToVectorStoreFormat(analysisResult, markdownContent);
    console.info('  ✓ Transformation complete');

    const totalCost = pdfResult.metadata.costs.total + analysisResult.processingMetadata.costs.total;
    console.info(`\n✓ Successfully processed: ${filename}`);
    console.info(`  Total cost: $${totalCost.toFixed(4)}`);

    return vectorStoreDocument;
  } catch (error) {
    console.error(`✗ Error processing ${filename}:`, error);
    return null;
  }
}

/**
 * Main function
 */
async function main() {
  const startTime = performance.now();

  console.info('═══════════════════════════════════════');
  console.info('PDF Processing Pipeline');
  console.info('Using @openvaa/file-processing API');
  console.info('═══════════════════════════════════════\n');

  // Check for API key
  if (!process.env.LLM_GEMINI_API_KEY) {
    console.error('Error: LLM_GEMINI_API_KEY environment variable not set!');
    console.error('Please add LLM_GEMINI_API_KEY to your .env file');
    process.exit(1);
  }

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.info(`✓ Created output directory: ${OUTPUT_DIR}\n`);
  }

  // Initialize LLM Provider
  const llmProvider = new LLMProvider({
    provider: 'google',
    apiKey: process.env.LLM_GEMINI_API_KEY || '',
    modelConfig: { primary: 'gemini-2.5-flash-preview-09-2025' }
  });

  const modelConfig = { primary: 'gemini-2.5-flash-preview-09-2025' };

  // Find all PDF files
  console.info(`Searching for PDFs in: ${UNPROCESSED_DIR}\n`);
  const pdfFiles = findPDFs(UNPROCESSED_DIR);

  if (pdfFiles.length === 0) {
    console.info('No PDF files found.');
    return;
  }

  console.info(`Found ${pdfFiles.length} PDF file(s):`);
  pdfFiles.forEach(({ filename, subdirectory }) => {
    console.info(`  - ${subdirectory}/${filename}`);
  });
  console.info('');

  // Process each PDF
  let successCount = 0;
  let failureCount = 0;
  let totalCost = 0;
  let totalSegments = 0;
  let totalFacts = 0;

  for (let i = 0; i < pdfFiles.length; i++) {
    const { path: pdfPath, filename } = pdfFiles[i];
    console.info(`\n${'='.repeat(60)}`);
    console.info(`Processing [${i + 1}/${pdfFiles.length}]: ${filename}`);
    console.info('='.repeat(60));

    const result = await processPDF(pdfPath, filename, llmProvider, modelConfig);

    if (result) {
      successCount++;

      // Save to output directory
      const outputFileName = `${path.basename(filename, '.pdf')}.json`;
      const outputPath = path.join(OUTPUT_DIR, outputFileName);
      fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
      console.info(`  Saved to: ${outputFileName}`);

      // Update statistics
      totalSegments += result.segments.length;
      totalFacts += result.facts.length;
    } else {
      failureCount++;
    }

    // Small delay to avoid rate limiting
    if (i < pdfFiles.length - 1) {
      console.info('\nWaiting 2s before next file...');
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  // Get total cost from LLM provider
  totalCost = llmProvider.cumulativeCosts;

  // Summary
  const totalTime = performance.now() - startTime;
  console.info('\n' + '═'.repeat(60));
  console.info('Processing Complete');
  console.info('═'.repeat(60));
  console.info(`Total PDFs: ${pdfFiles.length}`);
  console.info(`Successful: ${successCount}`);
  console.info(`Failed: ${failureCount}`);
  console.info(`Total segments: ${totalSegments}`);
  console.info(`Total facts extracted: ${totalFacts}`);
  console.info(`Total cost: $${totalCost.toFixed(4)}`);
  if (successCount > 0) {
    console.info(`Average cost per PDF: $${(totalCost / successCount).toFixed(4)}`);
    console.info(`Average time per PDF: ${(totalTime / successCount / 1000).toFixed(2)}s`);
  }
  console.info(`Total time: ${(totalTime / 1000 / 60).toFixed(2)} minutes`);
  console.info(`\nResults saved to: ${OUTPUT_DIR}`);
  console.info('═'.repeat(60));
}

// Run the script
main().catch((error) => {
  console.error('\n✗ Fatal error:', error);
  process.exit(1);
});
