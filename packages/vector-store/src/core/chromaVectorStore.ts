import { ChromaClient } from 'chromadb';
import { VectorStore } from '../core/vectorStore.type';
import type { Collection } from 'chromadb';
import type { SearchResult, VectorStoreConfig } from '../core/vectorStore.type';
import type { Embedder } from './embedder.type';
import type { SourceSegment } from './types';

export class ChromaVectorStore extends VectorStore {
  private client: ChromaClient;
  private collection: Collection | null = null;
  private config: VectorStoreConfig;
  private embedder: Embedder; // extract from config for brevity

  constructor(config: VectorStoreConfig) {
    super();
    this.config = config;
    this.embedder = config.embedder;
    this.client = new ChromaClient();
  }

  async initialize(): Promise<void> {
    this.collection = await this.client.getOrCreateCollection({
      name: this.config.collectionName,
      metadata: { 'hnsw:space': 'cosine' } // cosine similarity
    });
  }

  async addTexts(texts: Array<SourceSegment>): Promise<void> {
    if (!this.collection) throw new Error('Not initialized');

    // Embed texts ONLY if they don't have embeddings
    const textsWithEmbeddings = await Promise.all(
      texts.map(async (text: SourceSegment) => {
        if (!text.embedding || text.embedding.length === 0) {
          const result = await this.embedder.embed(text.content);
          return { ...text, embedding: result.embedding };
        }
        return text;
      })
    );
    // Add to ChromaDB collection
    await this.collection.add({
      ids: textsWithEmbeddings.map((t: SourceSegment) => t.id),
      documents: textsWithEmbeddings.map((t: SourceSegment) => t.content),
      embeddings: textsWithEmbeddings.map((t: SourceSegment) => t.embedding || []),
      metadatas: textsWithEmbeddings.map((t: SourceSegment) => ({ parentId: t.parentDocId }))
    });
  }

  async search(query: string, topK: number = 5): Promise<Array<SearchResult>> {
    if (!this.collection) throw new Error('Not initialized');

    const queryEmbedding = await this.embedder.embed(query);

    // Search
    const results = await this.collection.query({
      queryEmbeddings: [queryEmbedding.embedding],
      nResults: topK
    });

    // Map results to SearchResult
    return results.ids[0].map((id: string, idx: number) => ({
      segment: {
        id: id as string,
        parentDocId: results.metadatas[0][idx]?.parentDocId as string,
        segmentIndex: results.metadatas[0][idx]?.segmentIndex as number,
        content: results.documents[0][idx] as string,
        embedding: results.embeddings?.[0][idx] || [],
        metadata: results.metadatas[0][idx] as unknown as SourceSegment['metadata']
      },
      score: 1 - (results.distances?.[0][idx] || 0), // Convert distance to score
      distance: results.distances?.[0][idx] || 0
    }));
  }

  async delete(ids: Array<string>): Promise<void> {
    if (!this.collection) throw new Error('Not initialized');
    await this.collection.delete({ ids });
  }

  async clear(): Promise<void> {
    if (!this.collection) {
      await this.client.deleteCollection({ name: this.config.collectionName });
      await this.initialize();
    }
  }
}
