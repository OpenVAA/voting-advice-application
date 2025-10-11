import { LLMProvider } from '@openvaa/llm-refactor';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { segmentInputText } from '../core/processing/docProcessing';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '..', '.env') });
let segmentsGlobal: Array<string> = [];

/**
 * Segmentation script that:
 * 1. Reads text files from docs/partiallyProcessed/
 * 2. Segments them using the segmentInputText function
 * 3. Saves segmented text to docs/segmented/ with segments separated by empty lines
 */
export async function segmentDocuments(): Promise<void> {
  const baseDir = path.join(__dirname, '..');
  const partiallyProcessedDir = path.join(baseDir, 'docs', 'partiallyProcessed');
  const segmentedDir = path.join(baseDir, 'docs', 'segmented');

  // Check if partiallyProcessed directory exists
  if (!fs.existsSync(partiallyProcessedDir)) {
    throw new Error(`Partially processed docs directory not found: ${partiallyProcessedDir}`);
  }

  // Create segmented directory if it doesn't exist
  if (!fs.existsSync(segmentedDir)) {
    fs.mkdirSync(segmentedDir, { recursive: true });
    console.info(`✓ Created segmented directory: ${segmentedDir}\n`);
  }

  // Get all text files from the partiallyProcessed directory
  const textFiles = fs.readdirSync(partiallyProcessedDir).filter((file) => file.endsWith('.txt'));

  if (textFiles.length === 0) {
    throw new Error(`No text files found in ${partiallyProcessedDir}`);
  }

  console.info(`Found ${textFiles.length} document(s) to segment\n`);

  // Initialize LLM Provider
  const provider = new LLMProvider({
    provider: 'google',
    apiKey: process.env.LLM_GEMINI_API_KEY || '',
    modelConfig: { primary: 'FALLBACK_MODEL_LOL!' }
  });

  // Process each document
  let totalSegments = 0;

  for (const textFile of textFiles) {
    const inputFilePath = path.join(partiallyProcessedDir, textFile);
    const outputFileName = textFile; // Keep the same filename
    const outputFilePath = path.join(segmentedDir, outputFileName);

    try {
      console.info(`Processing: ${textFile}`);

      // Read the input text
      const inputText = fs.readFileSync(inputFilePath, 'utf-8');

      // Segment the text using the segmentInputText function
      const segments = await segmentInputText({
        inputText,
        provider,
        modelConfig: { primary: 'gemini-2.5-flash-preview-09-2025' }
      });
      segmentsGlobal = segments;

      console.info(`  - Content length: ${inputText.length} characters`);
      console.info('  - Content length no spaces: ', inputText.replace(/\s/g, '').length);
      console.info('  - Segment lengths sum: ', segments.reduce((sum, segment) => sum + segment.length, 0));
      console.info('  - Segment lengths sum no spaces: ', segments.reduce((sum, segment) => sum + segment.replace(/\s/g, '').length, 0));
      console.info(`  - Created ${segments.length} segment(s)`);
      console.info('  - Segment lengths: ', segments.map((segment) => segment.length));

      // Join segments with empty lines (double newline)
      const outputText = segments.join('\n\n\n\n');

      // Write the segmented text to the output file
      fs.writeFileSync(outputFilePath, outputText, 'utf-8');

      totalSegments += segments.length;
    } catch (error) {
      console.error(`✗ Error processing ${textFile}:`, error);
      continue;
    }
  }

  console.info('═══════════════════════════════════════');
  console.info('Segmentation process complete!');
  console.info(`Total documents processed: ${textFiles.length}`);
  console.info('Average segment length: ', totalSegments / textFiles.length); 
  console.info('Biggest segment length: ', Math.max(...segmentsGlobal.map((segment) => segment.length)));
  console.info('Smallest segment length: ', Math.min(...segmentsGlobal.map((segment) => segment.length)));
  console.info(`Total segments created: ${totalSegments}`);
  console.info('═══════════════════════════════════════\n');
}

// Run the segmentation if this script is executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  segmentDocuments()
    .then(() => {
      console.info('All documents have been segmented.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error during segmentation:', error);
      process.exit(1);
    });
}
