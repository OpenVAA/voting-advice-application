import { isTextPreserved } from '@openvaa/file-processing';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Parse segments from a segmented text file
 * Expected format:
 * === SEGMENT N ===
 * [Summary: ...]
 *
 * <segment text content>
 *
 *
 * @param segmentedContent - The full content of the segmented file
 * @returns Array of segment text strings (without headers or summaries)
 */
function parseSegments(segmentedContent: string): Array<string> {
  const segments: Array<string> = [];

  // Split by segment headers
  const segmentParts = segmentedContent.split(/===\s*SEGMENT\s+\d+\s*===/);

  // Skip the first part (before the first segment header)
  for (let i = 1; i < segmentParts.length; i++) {
    const part = segmentParts[i];

    // Find the summary line (starts with [Summary: and ends with ])
    const summaryMatch = part.match(/\[Summary:[^\]]+\]/);

    if (!summaryMatch) {
      console.warn(`Warning: No summary found in segment ${i}`);
      continue;
    }

    // Get the text after the summary
    const summaryEndIndex = part.indexOf(summaryMatch[0]) + summaryMatch[0].length;
    const segmentText = part.substring(summaryEndIndex).trim();

    if (segmentText) {
      segments.push(segmentText);
    }
  }

  return segments;
}

/**
 * Verify that segmentation preserved the original text
 */
async function verifySegmentation(originalFilePath: string, segmentedFilePath: string): Promise<void> {
  console.info('═══════════════════════════════════════');
  console.info('Text Preservation Verification');
  console.info('═══════════════════════════════════════\n');

  // Check if files exist
  if (!fs.existsSync(originalFilePath)) {
    throw new Error(`Original file not found: ${originalFilePath}`);
  }

  if (!fs.existsSync(segmentedFilePath)) {
    throw new Error(`Segmented file not found: ${segmentedFilePath}`);
  }

  console.info(`Original file: ${path.relative(process.cwd(), originalFilePath)}`);
  console.info(`Segmented file: ${path.relative(process.cwd(), segmentedFilePath)}\n`);

  // Read files
  console.info('Reading files...');
  const originalText = fs.readFileSync(originalFilePath, 'utf-8');
  const segmentedContent = fs.readFileSync(segmentedFilePath, 'utf-8');
  console.info('✓ Files read successfully\n');

  // Parse segments
  console.info('Parsing segments...');
  const segments = parseSegments(segmentedContent);
  console.info(`✓ Parsed ${segments.length} segments\n`);

  // Display segment info
  console.info('Segment details:');
  segments.forEach((segment, index) => {
    const preview = segment.length > 100 ? segment.substring(0, 100) + '...' : segment;
    console.info(`  Segment ${index + 1}: ${segment.length} chars - "${preview}"`);
  });
  console.info('');

  // Verify text preservation
  console.info('Verifying text preservation...');
  try {
    isTextPreserved(originalText, segments);
    console.info('✓ Text preservation verified!\n');

    console.info('═══════════════════════════════════════');
    console.info('✓ SUCCESS: Segmentation preserved all text correctly');
    console.info('═══════════════════════════════════════');
  } catch (error) {
    console.error('✗ Text preservation verification failed!\n');
    console.error('═══════════════════════════════════════');
    console.error('✗ FAILURE: Segmentation did not preserve text');
    console.error('═══════════════════════════════════════');

    if (error instanceof Error) {
      console.error('\nError details:', error.message);
    }
    throw error;
  }
}

// Run verification if this script is executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  const baseDir = path.join(__dirname, '..');
  const originalFilePath = path.join(baseDir, 'docs', 'step0_unprocessed', 'official', 'txt', 'eu-simplified.txt');
  const segmentedFilePath = path.join(baseDir, 'docs', 'NEW_segmentedTexts', 'official', 'eu-simplified_segments.txt');

  verifySegmentation(originalFilePath, segmentedFilePath)
    .then(() => {
      console.info('\n✓ Verification complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n✗ Verification failed');
      if (error instanceof Error && error.stack) {
        console.error(error.stack);
      }
      process.exit(1);
    });
}

export { parseSegments, verifySegmentation };
