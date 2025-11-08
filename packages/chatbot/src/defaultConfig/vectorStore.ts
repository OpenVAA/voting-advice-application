import { MultiVectorStore, OpenAIEmbedder } from '@openvaa/vector-store';
import { OPENAI_API_KEY } from '../apiKey'; // TOOD: centralize to .env

/** Collection identifiers for multi-vector retrieval. Change according to the election. */
export const COLLECTION_NAMES = {
  segments: 'eu-2024-segments',
  summaries: 'eu-2024-summaries',
  facts: 'eu-2024-facts'
} as const;

export async function getVectorStore(): Promise<MultiVectorStore> {
  const embedder = new OpenAIEmbedder({
    model: 'text-embedding-3-small',
    dimensions: 1536,
    apiKey: OPENAI_API_KEY
  });

  const store = new MultiVectorStore({
    collectionNames: COLLECTION_NAMES,
    embedder,
    chromaPath: 'http://localhost:8000'
  });

  await store.initialize();
  return store;
}
