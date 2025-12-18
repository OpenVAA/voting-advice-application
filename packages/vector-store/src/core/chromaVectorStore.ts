import { ChromaClient } from 'chromadb';
import { enrichSegmentsWithMetadata } from './utils/dataTransform';
import { unwrapChromaResult } from './utils/unwrapChromaResult';
import { VectorStore } from '../core/vectorStore.type';
import type { Collection, Metadata } from 'chromadb';
import type { SingleSearchResult, VectorSearchResult, VectorStoreConfig } from '../core/vectorStore.type';
import type { Embedder } from './embedder.type';
import type { SegmentWithMetadata, SourceMetadata, SourceSegment } from './source.types';

/**
 * ChromaDB vector store.
 */
export class ChromaVectorStore extends VectorStore {
  private client: ChromaClient;
  private collection: Collection | null = null;
  private config: VectorStoreConfig;
  private embedder: Embedder;

  constructor(config: VectorStoreConfig) {
    super();
    this.config = config;
    this.embedder = config.embedder;
    this.client = new ChromaClient(config.chromaPath ? { path: config.chromaPath } : {});
  }

  async initialize(): Promise<void> {
    this.collection = await this.client.getOrCreateCollection({
      name: this.config.collectionName,
      metadata: { 'hnsw:space': 'cosine' } // cosine similarity
    });
  }

  async addSegments({
    segments,
    metadata
  }: {
    segments: Array<SourceSegment>;
    metadata: SourceMetadata;
  }): Promise<void> {
    if (!this.collection) throw new Error('ChromaVectorStore not properly initialized. Call initialize() first.');

    // Add parent document's metadata before embedding (de-normalize)
    const segs = enrichSegmentsWithMetadata({ segments, metadata });

    // Check if the collection exists
    if (!this.collection)
      throw new Error(
        'ChromaVectorStore cannot add items to a non-existent collection. Vector store not properly initialized. Call initialize() first.'
      );

    // Any segments to add?
    if (segs.length === 0) return;

    // Generate embeddings for each segment
    const embeddings = await Promise.all(segs.map((seg) => this.embedder.embed(seg.content)));

    // Add to ChromaDB collection
    await this.collection.add({
      ids: segs.map((seg: SegmentWithMetadata) => seg.id),
      documents: segs.map((seg: SegmentWithMetadata) => seg.content),
      metadatas: segs.map((seg: SegmentWithMetadata) => seg.metadata as Metadata),
      embeddings: embeddings.map((embedding) => embedding.embedding)
    });
  }

  /**
   * Delete items from the collection
   * @param ids - Array of item IDs to delete
   */
  async delete(ids: Array<string>): Promise<void> {
    if (!this.collection)
      throw new Error(
        'ChromaVectorStore cannot delete items from a non-existent collection. Vector store not properly initialized. Call initialize() first.'
      );
    await this.collection.delete({ ids });
  }

  async clear(): Promise<void> {
    if (this.collection && this.collection.name === this.config.collectionName) {
      await this.client.deleteCollection({ name: this.config.collectionName });
      await this.initialize();
    }
  }

  async search({ query, topK = 100 }: { query: string; topK?: number }): Promise<VectorSearchResult> {
    console.info('[ChromaVectorStore] Searching with query:', query);
    if (!this.collection)
      throw new Error(
        'ChromaVectorStore cannot search in a non-existent collection. Vector store not properly initialized. Call initialize() first.'
      );

    // Embed the query
    const queryEmbedding = await this.embedder.embed(query);
    console.info('[ChromaVectorStore] Query embedding:', queryEmbedding);

    // Search ChromaDB
    const rawResults = await this.collection.query({
      queryEmbeddings: [queryEmbedding.embedding],
      nResults: topK
    });
    console.info('[ChromaVectorStore] Raw results:', rawResults);
    // Unwrap the results
    const { ids, distances, documents, metadatas } = unwrapChromaResult(rawResults);
    console.info('[ChromaVectorStore] Unwrapped results:', { ids, distances, documents, metadatas });
    // Any results?
    if (!ids || ids.length === 0) {
      return { results: [], timestamp: Date.now(), rerankingCosts: undefined };
    }

    // Convert to our own format: SingleSearchResult
    const searchResults: Array<SingleSearchResult> = [];

    // Loop through results and convert to SearchResult format
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const distance = distances?.[i] || 0;
      const documentId = metadatas?.[i]?.documentId as string;
      const segmentIndex = metadatas?.[i]?.segmentIndex as number;

      searchResults.push({
        segment: {
          id,
          documentId,
          segmentIndex,
          content: documents?.[i] || '',
          metadata: metadatas?.[i] || {}
        },
        vectorSearchScore: 1 - distance, // Convert distance to similarity score (assuming cosine)
        distance,
        rerankScore: undefined
      });
    }
    console.info('[ChromaVectorStore] Search results:', searchResults);
    return { results: searchResults, timestamp: Date.now(), rerankingCosts: undefined };
  }
}
