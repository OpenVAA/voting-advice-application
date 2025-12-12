import { ChromaVectorStore, OpenAIEmbedder } from '@openvaa/vector-store';

/** Collection name for vector store. Change according to the election. */
export const COLLECTION_NAME = 'openvaa-eu-2024-elections';

export async function getVectorStore(openAIAPIKey: string): Promise<ChromaVectorStore> {
  const embedder = new OpenAIEmbedder({
    model: 'text-embedding-3-small',
    dimensions: 1536,
    apiKey: openAIAPIKey
  });

  const chromaPath = process.env.CHROMA_URL || 'http://localhost:8000';

  const store = new ChromaVectorStore({
    collectionName: COLLECTION_NAME,
    embedder,
    chromaPath
  });

  await store.initialize();
  return store;
}
