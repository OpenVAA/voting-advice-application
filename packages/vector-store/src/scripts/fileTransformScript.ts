/* eslint-disable no-console */
import * as fs from 'fs';
import * as path from 'path';
import type { SourceDocument } from '../types/sourceDocument';

/**
 * Reference JSON structure with a pointer to a text file
 */
interface ReferenceJson {
  id: string;
  source: string;
  link?: string;
  contentFileName: string;
}

/**
 * Transforms reference JSONs to pure SourceDocuments by:
 * 1. Reading reference JSON files from docs/raw/referenceJsons/
 * 2. Reading the corresponding text files from docs/raw/textFiles/
 * 3. Creating properly escaped SourceDocument JSONs in docs/pure/
 *
 * This ensures that text content is properly JSON-escaped and validated
 * before being used for embedding.
 */
export async function transformReferenceToPure(): Promise<void> {
  const baseDir = path.join(__dirname, '..');
  const referenceDir = path.join(baseDir, 'docs', 'raw', 'referenceJsons');
  const textFilesDir = path.join(baseDir, 'docs', 'raw', 'textFiles');
  const pureDir = path.join(baseDir, 'docs', 'pure');

  // Ensure the pure directory exists
  if (!fs.existsSync(pureDir)) {
    fs.mkdirSync(pureDir, { recursive: true });
  }

  // Get all JSON files from the reference directory
  const referenceFiles = fs.readdirSync(referenceDir).filter((file) => file.endsWith('.json'));

  console.log(`Found ${referenceFiles.length} reference JSON file(s) to process`);

  for (const referenceFile of referenceFiles) {
    const referenceFilePath = path.join(referenceDir, referenceFile);

    try {
      // Read and parse the reference JSON
      const referenceContent = fs.readFileSync(referenceFilePath, 'utf-8');
      const referenceJson: ReferenceJson = JSON.parse(referenceContent);

      // Validate reference JSON structure
      if (!referenceJson.id || !referenceJson.source || !referenceJson.contentFileName) {
        console.error(`Invalid reference JSON structure in ${referenceFile}`);
        continue;
      }

      // Read the corresponding text file
      const textFilePath = path.join(textFilesDir, referenceJson.contentFileName);

      if (!fs.existsSync(textFilePath)) {
        console.error(`Text file not found: ${textFilePath}`);
        continue;
      }

      const textContent = fs.readFileSync(textFilePath, 'utf-8');

      // Create the SourceDocument
      const sourceDocument: SourceDocument = {
        id: referenceJson.id,
        source: referenceJson.source,
        ...(referenceJson.link && { link: referenceJson.link }),
        content: textContent
      };

      // Convert to JSON string (this automatically handles all escaping)
      const jsonString = JSON.stringify(sourceDocument, null, 2);

      // Validate that the JSON is valid by parsing it back
      try {
        const validated = JSON.parse(jsonString) as SourceDocument;

        // Ensure all required fields are present
        if (!validated.id || !validated.source || !validated.content) {
          throw new Error('Missing required fields in generated SourceDocument');
        }

        // Save to the pure directory with the same filename
        const pureFilePath = path.join(pureDir, referenceFile);
        fs.writeFileSync(pureFilePath, jsonString, 'utf-8');

        console.log(`✓ Successfully transformed ${referenceFile} -> docs/pure/${referenceFile}`);
        console.log(`  - Content length: ${textContent.length} characters`);
      } catch (validationError) {
        console.error(`Validation failed for ${referenceFile}:`, validationError);
        continue;
      }
    } catch (error) {
      console.error(`Error processing ${referenceFile}:`, error);
      continue;
    }
  }

  console.log('\nTransformation complete!');
}

// Run the transformation if this script is executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  transformReferenceToPure()
    .then(() => {
      console.log('All reference JSONs have been transformed to pure SourceDocuments');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error during transformation:', error);
      process.exit(1);
    });
}
