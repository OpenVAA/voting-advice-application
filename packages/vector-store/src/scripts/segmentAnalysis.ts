import { LLMProvider } from '@openvaa/llm-refactor';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { analyzeSegments } from '../core/processing/docProcessing';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '..', '.env') });

const SEGMENT_SEPARATOR = '\n\n<SEGMENT_SEPARATOR>\n\n';

/**
 * Segment analysis script that:
 * 1. Reads segmented text files from docs/segmented/
 * 2. Analyzes them using the analyzeSegments function (with sliding window context)
 * 3. Saves analysis results (summaries + standalone facts) to docs/segmentsAnalyzed/
 */
export async function analyzeSegmentedDocuments(): Promise<void> {
  const startTime = performance.now();
  const baseDir = path.join(__dirname, '..');
  const segmentedDir = path.join(baseDir, 'docs', 'segmented');
  const outputDir = path.join(baseDir, 'docs', 'segmentsAnalyzed');

  // Check if segmented directory exists
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

  console.info(`Found ${textFiles.length} segmented document(s) to analyze\n`);

  // Initialize LLM Provider
  const provider = new LLMProvider({
    provider: 'google',
    apiKey: process.env.LLM_GEMINI_API_KEY || '',
    modelConfig: { primary: 'I-AM-USELESS!' }
  });

  let totalSegmentsAnalyzed = 0;
  let totalStandaloneFacts = 0;

  for (const textFile of textFiles) {
    const inputFilePath = path.join(segmentedDir, textFile);
    const outputFileName = textFile.replace('.txt', '.json');
    const outputFilePath = path.join(outputDir, outputFileName);

    try {
      console.info(`Processing: ${textFile}`);

      // Read the segmented text
      const fileContent = fs.readFileSync(inputFilePath, 'utf-8');

      // Split by separator to reconstruct segments array
      const segments = fileContent.split(SEGMENT_SEPARATOR).filter((s) => s.trim().length > 0);

      console.info(`  - Found ${segments.length} segment(s)`);

      // Analyze segments with LLM
      const analysisResults = await analyzeSegments({
        segments,
        provider,
        modelConfig: { primary: 'gemini-2.5-flash-preview-09-2025' },
        inputText: '' // Not used in analyzeSegments but required by interface
      });

      // Calculate statistics
      const factsCount = analysisResults.reduce((sum, r) => sum + r.standaloneFacts.length, 0);
      const avgSummaryLength = analysisResults.reduce((sum, r) => sum + r.summary.length, 0) / analysisResults.length;

      console.info(`  - Generated ${analysisResults.length} summaries`);
      console.info(`  - Extracted ${factsCount} standalone facts`);
      console.info(`  - Average summary length: ${Math.round(avgSummaryLength)} chars`);

      // Write results to JSON file
      fs.writeFileSync(outputFilePath, JSON.stringify(analysisResults, null, 2), 'utf-8');

      totalSegmentsAnalyzed += segments.length;
      totalStandaloneFacts += factsCount;
      console.info(`  ✓ Saved to: ${outputFileName}\n`);
    } catch (error) {
      console.error(`✗ Error processing ${textFile}:`, error);
      continue;
    }
  }

  console.info('═══════════════════════════════════════');
  console.info('Segment analysis complete!');
  console.info(`Total documents processed: ${textFiles.length}`);
  console.info(`Total segments analyzed: ${totalSegmentsAnalyzed}`);
  console.info(`Total standalone facts extracted: ${totalStandaloneFacts}`);
  console.info(`Total cost: ${provider.cumulativeCosts.toFixed(4)} USD`);
  console.info(`Average cost per segment: ${provider.cumulativeCosts / totalSegmentsAnalyzed}`);
  console.info('Total time: ', performance.now() - startTime, 'ms');
  console.info('Average time per segment: ', (performance.now() - startTime) / totalSegmentsAnalyzed, 'ms');
  console.info('═══════════════════════════════════════\n');
}

// Run the script if executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  analyzeSegmentedDocuments()
    .then(() => {
      console.info('All segments have been analyzed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error during segment analysis:', error);
      process.exit(1);
    });
}
