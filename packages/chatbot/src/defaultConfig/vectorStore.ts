import { MultiVectorStore, OpenAIEmbedder } from '@openvaa/vector-store';

/** Collection identifiers for multi-vector retrieval. Change according to the election. */
export const COLLECTION_NAMES = {
  segments: 'eu-2024-segments',
  summaries: 'eu-2024-summaries',
  facts: 'eu-2024-facts'
} as const;

export async function getVectorStore(openAIAPIKey: string): Promise<MultiVectorStore> {
  const embedder = new OpenAIEmbedder({
    model: 'text-embedding-3-small',
    dimensions: 1536,
    apiKey: openAIAPIKey
  });

  const chromaPath = process.env.CHROMA_URL || 'http://localhost:8000';

  const store = new MultiVectorStore({
    collectionNames: COLLECTION_NAMES,
    embedder,
    chromaPath
  });

  await store.initialize();
  return store;
}
