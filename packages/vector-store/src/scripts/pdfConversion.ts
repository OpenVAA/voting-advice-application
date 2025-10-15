import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '..', '.env') });

const startTime = performance.now();

const ai = new GoogleGenAI({ apiKey: process.env.LLM_GEMINI_API_KEY || '' });

// Directories
const UNPROCESSED_DIR = path.join(__dirname, '../docs/step0_unprocessed');
const PROCESSED_DIR = path.join(__dirname, '../docs/step1_markdown');

// Ensure processed directory exists
if (!fs.existsSync(PROCESSED_DIR)) {
  fs.mkdirSync(PROCESSED_DIR, { recursive: true });
}

/**
 * Prompt for converting PDFs to Markdown
 */
const EXTRACTION_PROMPT = `
Convert this PDF document to clean, well-formatted Markdown.

Requirements:
- Preserve all text content from the document
- Maintain the document structure with appropriate heading levels (# ## ###)
- Keep tables, lists, and other formatting in Markdown syntax
- Preserve paragraphs and line breaks appropriately
- Do not add any commentary or explanations
- Return ONLY the markdown content, no additional text or formatting

Return the markdown content directly without any code blocks or preamble.
`;

/**
 * Process a single PDF file and convert it to Markdown
 */
async function processPDF(filePath: string): Promise<string | null> {
  try {
    console.info(`Processing: ${filePath}`);

    // Read PDF file
    const pdfBuffer = fs.readFileSync(filePath);
    const base64Data = pdfBuffer.toString('base64');

    // Prepare content for Gemini
    const contents = [
      { text: EXTRACTION_PROMPT },
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: base64Data
        }
      }
    ];

    // Call Gemini 2.5 Pro
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro', // this is a good model for this task
      contents: contents
    });

    const markdownContent = response.text?.trim() || '';

    console.info(`✓ Successfully processed: ${path.basename(filePath)}`);
    return markdownContent;
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error);
    return null;
  }
}

/**
 * Find all PDF files in a directory recursively
 */
function findPDFs(dir: string): Array<{ path: string; subdirectory: string }> {
  const results: Array<{ path: string; subdirectory: string }> = [];

  if (!fs.existsSync(dir)) {
    console.warn(`Directory not found: ${dir}`);
    return results;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Recursively search subdirectories
      const subdirectoryName = entry.name;
      const subResults = findPDFsInSubdirectory(fullPath, subdirectoryName);
      results.push(...subResults);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.pdf')) {
      results.push({
        path: fullPath,
        subdirectory: 'root'
      });
    }
  }

  return results;
}

/**
 * Find PDFs in a specific subdirectory
 */
function findPDFsInSubdirectory(dir: string, subdirectory: string): Array<{ path: string; subdirectory: string }> {
  const results: Array<{ path: string; subdirectory: string }> = [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Recursively search nested subdirectories
      const nestedResults = findPDFsInSubdirectory(fullPath, `${subdirectory}/${entry.name}`);
      results.push(...nestedResults);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.pdf')) {
      results.push({
        path: fullPath,
        subdirectory: subdirectory
      });
    }
  }

  return results;
}

/**
 * Main function to process all PDFs
 */
async function main() {
  console.info('=== PDF to Markdown Conversion ===\n');

  // Check for API key
  if (!process.env.LLM_GEMINI_API_KEY) {
    console.error('Error: LLM_GEMINI_API_KEY environment variable not set!');
    console.error('Please add LLM_GEMINI_API_KEY to your .env file');
    process.exit(1);
  }

  console.info(`Searching for PDFs in: ${UNPROCESSED_DIR}`);

  // Find all PDF files
  const pdfFiles = findPDFs(UNPROCESSED_DIR);

  if (pdfFiles.length === 0) {
    console.info('No PDF files found.');
    return;
  }

  console.info(`Found ${pdfFiles.length} PDF file(s)\n`);

  // Process each PDF
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < pdfFiles.length; i++) {
    const { path: pdfPath } = pdfFiles[i];
    console.info(`[${i + 1}/${pdfFiles.length}] Processing: ${path.basename(pdfPath)}`);

    const markdownContent = await processPDF(pdfPath);

    if (markdownContent) {
      successCount++;

      // Save as text file
      const outputFileName = `${path.basename(pdfPath, '.pdf')}.txt`;
      const outputPath = path.join(PROCESSED_DIR, outputFileName);
      fs.writeFileSync(outputPath, markdownContent, 'utf-8');
      console.info(`  Saved to: ${outputFileName}\n`);
    } else {
      failureCount++;
      console.info('');
    }

    // Add a small delay to avoid rate limiting
    if (i < pdfFiles.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // Summary
  console.info('=== Conversion Complete ===');
  console.info(`Total PDFs: ${pdfFiles.length}`);
  console.info(`Successful: ${successCount}`);
  console.info(`Failed: ${failureCount}`);
  console.info(`\nMarkdown documents saved to: ${PROCESSED_DIR}`);
  console.info('Total time: ', performance.now() - startTime, 'ms');
  console.info('Average time per PDF: ', (performance.now() - startTime) / pdfFiles.length, 'ms');
}

// Run the script
main().catch(console.error);
