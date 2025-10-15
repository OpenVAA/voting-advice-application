import { LLMProvider } from '@openvaa/llm-refactor';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { analyzeSegments, extractMetadata } from '../core/docProcessing';
import { transformToVectorStoreFormat } from '../core/utils/dataTransform';
import type { SegmentFact, SegmentSummary, SourceDocument, SourceSegment } from '../core/types';

/** @example
 * ```typescript
 * {
 *   excerpts: [excerpt1, excerpt2],
 *   excerptSummaries: [excerptSummary1, excerptSummary2],
 *   fullDocument: sourceDocument
 * }
 * ```
 */
export interface DocProcessingResult {
  fullDocument: SourceDocument;
  segments: Array<SourceSegment>;
  summaries: Array<SegmentSummary>;
  facts: Array<SegmentFact>;
}

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '..', '.env') });

const SEGMENT_SEPARATOR = '\n\n<SEGMENT_SEPARATOR>\n\n';

/**
 * Document analysis script that:
 * 1. Reads markdown text files from docs/step1_markdown/
 * 2. Reads segmented text files from docs/step2_segmented/
 * 3. Extracts metadata from the markdown
 * 4. Analyzes segments using the analyzeSegments function (with sliding window context)
 * 5. Transforms results into DocProcessingResult format
 * 6. Saves complete results to docs/step3_ready/
 */
export async function analyzeSegmentedDocuments(): Promise<void> {
  const startTime = performance.now();
  const baseDir = path.join(__dirname, '..');
  const markdownDir = path.join(baseDir, 'docs', 'step1_markdown');
  const segmentedDir = path.join(baseDir, 'docs', 'step2_segmented');
  const outputDir = path.join(baseDir, 'docs', 'step3_ready');

  // Check if directories exist
  if (!fs.existsSync(markdownDir)) {
    throw new Error(`Markdown docs directory not found: ${markdownDir}`);
  }
  if (!fs.existsSync(segmentedDir)) {
    throw new Error(`Segmented docs directory not found: ${segmentedDir}`);
  }

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.info(`✓ Created output directory: ${outputDir}\n`);
  }

  // Get all text files from the segmented directory
  const textFiles = fs.readdirSync(segmentedDir).filter((file) => file.endsWith('.txt'));

  if (textFiles.length === 0) {
    throw new Error(`No text files found in ${segmentedDir}`);
  }

  console.info(`Found ${textFiles.length} document(s) to analyze\n`);

  // Initialize LLM Provider
  const provider = new LLMProvider({
    provider: 'google',
    apiKey: process.env.LLM_GEMINI_API_KEY || '',
    modelConfig: { primary: 'I-AM-USELESS!' }
  });

  let totalSegmentsAnalyzed = 0;
  let totalStandaloneFacts = 0;

  for (const textFile of textFiles) {
    const segmentedFilePath = path.join(segmentedDir, textFile);
    const markdownFilePath = path.join(markdownDir, textFile);
    const outputFileName = textFile.replace('.txt', '.json');
    const outputFilePath = path.join(outputDir, outputFileName);

    try {
      console.info(`Processing: ${textFile}`);

      // Check if corresponding markdown file exists
      if (!fs.existsSync(markdownFilePath)) {
        console.error(`✗ Markdown file not found: ${markdownFilePath}`);
        continue;
      }

      // Read the markdown text for metadata extraction and full document
      const markdownContent = fs.readFileSync(markdownFilePath, 'utf-8');

      // Read the segmented text
      const segmentedContent = fs.readFileSync(segmentedFilePath, 'utf-8');

      // Split by separator to reconstruct segments array
      const segments = segmentedContent.split(SEGMENT_SEPARATOR).filter((s) => s.trim().length > 0);

      console.info(`  - Found ${segments.length} segment(s)`);

      // Extract metadata from the markdown
      console.info('  - Extracting metadata...');
      const metadata = await extractMetadata({
        inputText: markdownContent,
        provider,
        modelConfig: { primary: 'gemini-2.5-flash-preview-09-2025' }
      });

      // Generate document ID: docname + UUID
      const docName = path.basename(textFile, '.txt');
      const documentId = `${docName}_${crypto.randomUUID()}`;

      // Analyze segments with LLM
      console.info('  - Analyzing segments...');
      const analysisResults = await analyzeSegments({
        parentDocId: documentId,
        segments,
        provider,
        modelConfig: { primary: 'gemini-2.5-flash-preview-09-2025' },
        inputText: '' // Not used in analyzeSegments but required by interface
      });

      // Transform to vector store format
      const {
        segments: sourceSegments,
        summaries,
        facts
      } = transformToVectorStoreFormat(analysisResults, documentId, metadata);

      // Create the full document
      const fullDocument: SourceDocument = {
        id: documentId,
        content: markdownContent,
        metadata
      };

      // Create the complete result
      const result: DocProcessingResult = {
        fullDocument,
        segments: sourceSegments,
        summaries,
        facts
      };

      // Update stats
      const factsCount = facts.length;
      const avgSummaryLength = summaries.reduce((sum, s) => sum + s.content.length, 0) / summaries.length;
      totalSegmentsAnalyzed += segments.length;
      totalStandaloneFacts += factsCount;

      console.info(`  - Generated ${summaries.length} summaries`);
      console.info(`  - Extracted ${factsCount} standalone facts`);
      console.info(`  - Average summary length: ${Math.round(avgSummaryLength)} chars`);
      console.info(`  - Document ID: ${documentId}`);

      // Write results to JSON file
      fs.writeFileSync(outputFilePath, JSON.stringify(result, null, 2), 'utf-8');

      console.info(`  ✓ Saved to: ${outputFileName}\n`);
    } catch (error) {
      console.error(`✗ Error processing ${textFile}:`, error);
      continue;
    }
  }

  console.info('═══════════════════════════════════════');
  console.info('Document analysis complete!');
  console.info(`Total documents processed: ${textFiles.length}`);
  console.info(`Total segments analyzed: ${totalSegmentsAnalyzed}`);
  console.info(`Total standalone facts extracted: ${totalStandaloneFacts}`);
  console.info(`Total cost: ${provider.cumulativeCosts.toFixed(4)} USD`);
  console.info(`Average cost per segment: ${(provider.cumulativeCosts / totalSegmentsAnalyzed).toFixed(6)} USD`);
  console.info(`Total time: ${((performance.now() - startTime) / 1000).toFixed(2)} seconds`);
  console.info(`Average time per segment: ${((performance.now() - startTime) / totalSegmentsAnalyzed).toFixed(2)} ms`);
  console.info('═══════════════════════════════════════\n');
}

// Run the script if executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  analyzeSegmentedDocuments()
    .then(() => {
      console.info('All documents have been analyzed and saved to step3_ready/');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error during document analysis:', error);
      process.exit(1);
    });
}
