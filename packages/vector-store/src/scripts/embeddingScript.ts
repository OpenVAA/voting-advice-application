import * as fs from 'fs';
import * as path from 'path';
import { ChromaVectorStore } from '../core/chromaVectorStore';
import { devEmbedder } from '../core/openAIEmbedder';
import { CharacterSegmenter } from '../core/segmenters';
import type { VectorStoreConfig } from '../core/vectorStore.type';
import type { SourceDocument } from '../types/sourceDocument';

// Configure the vector store
const vectorStoreConfig: VectorStoreConfig = {
  collectionName: 'hello_vector_store',
  embedder: devEmbedder
};

/**
 * Embedding script that:
 * 1. Reads transformed SourceDocuments from docs/pure/
 * 2. Segments them using CharacterSegmenter
 * 3. Embeds and stores them in ChromaDB using ChromaVectorStore
 */
export async function embedDocuments(): Promise<void> {
  const baseDir = path.join(__dirname, '..');
  const pureDir = path.join(baseDir, 'docs', 'pure');

  console.info('Starting embedding process...\n');

  // Check if pure directory exists
  if (!fs.existsSync(pureDir)) {
    throw new Error(`Pure docs directory not found: ${pureDir}\nPlease run the file transformation script first.`);
  }

  // Get all JSON files from the pure directory
  const pureFiles = fs.readdirSync(pureDir).filter((file) => file.endsWith('.json'));

  if (pureFiles.length === 0) {
    throw new Error(`No JSON files found in ${pureDir}\nPlease run the file transformation script first.`);
  }

  console.info(`Found ${pureFiles.length} document(s) to embed`);

  // Initialize the segmenter with character-based chunking
  const segmenter = new CharacterSegmenter({
    maxLength: 1000, // Characters per segment
    overlap: 200 // Character overlap for context preservation
  });

  // Initialize ChromaDB vector store
  const vectorStore = new ChromaVectorStore(vectorStoreConfig);
  await vectorStore.initialize();

  console.info('✓ Vector store initialized\n');

  // Process each document
  let totalSegments = 0;

  for (const pureFile of pureFiles) {
    const pureFilePath = path.join(pureDir, pureFile);

    try {
      // Read and parse the SourceDocument
      const fileContent = fs.readFileSync(pureFilePath, 'utf-8');
      const sourceDocument: SourceDocument = JSON.parse(fileContent);

      // Validate document structure
      if (!sourceDocument.id || !sourceDocument.source || !sourceDocument.content) {
        console.error(`✗ Invalid SourceDocument structure in ${pureFile}`);
        continue;
      }

      console.info(`Processing: ${pureFile}`);
      console.info(`  - ID: ${sourceDocument.id}`);
      console.info(`  - Source: ${sourceDocument.source}`);
      console.info(`  - Content length: ${sourceDocument.content.length} characters`);

      // Segment the document
      const segments = segmenter.segment(sourceDocument);
      console.info(`  - Created ${segments.length} segment(s)`);

      // Add segments to vector store (embeddings will be generated automatically)
      await vectorStore.addTexts(segments);
      totalSegments += segments.length;

      console.info(`✓ Embedded and stored ${segments.length} segment(s)\n`);
    } catch (error) {
      console.error(`✗ Error processing ${pureFile}:`, error);
      continue;
    }
  }

  console.info('═══════════════════════════════════════');
  console.info('Embedding process complete!');
  console.info(`Total documents processed: ${pureFiles.length}`);
  console.info(`Total segments embedded: ${totalSegments}`);
  console.info('═══════════════════════════════════════\n');
}

/**
 * Search example - demonstrates how to query the vector store
 */
export async function searchExample(query: string, topK: number = 5): Promise<void> {
  console.info(`\nSearching for: "${query}"\n`);

  const vectorStore = new ChromaVectorStore(vectorStoreConfig);
  await vectorStore.initialize();

  const results = await vectorStore.search(query, topK);

  console.info(`Found ${results.length} result(s):\n`);

  results.forEach((result, idx) => {
    console.info(`${idx + 1}. Score: ${result.score.toFixed(4)} (Distance: ${result.distance.toFixed(4)})`);
    console.info(`   Source ID: ${result.document.sourceId}`);
    console.info(`   Content preview: ${result.document.content.substring(0, 150)}...`);
    console.info('');
  });
}

// Run the embedding if this script is executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  const args = process.argv.slice(2);

  // Check if this is a search command
  if (args[0] === 'search' && args[1]) {
    const query = args.slice(1).join(' ');
    const topK = args.includes('--top') ? parseInt(args[args.indexOf('--top') + 1]) || 5 : 5;

    searchExample(query, topK)
      .then(() => {
        console.info('Search complete');
        process.exit(0);
      })
      .catch((error) => {
        console.error('Search error:', error);
        process.exit(1);
      });
  } else {
    // Run embedding
    embedDocuments()
      .then(() => {
        console.info('All documents have been embedded and stored in ChromaDB');
        process.exit(0);
      })
      .catch((error) => {
        console.error('Fatal error during embedding:', error);
        process.exit(1);
      });
  }
}
