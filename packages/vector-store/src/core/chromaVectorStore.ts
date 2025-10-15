import { ChromaClient } from 'chromadb';
import { transformToVectorStoreFormat } from './utils/dataTransform';
import { VectorStore } from '../core/vectorStore.type';
import type { SegmentWithAnalysis, SourceMetadata } from '@openvaa/file-processing';
import type { Collection, Metadata } from 'chromadb';
import type { SearchResult, VectorStoreConfig } from '../core/vectorStore.type';
import type { Embedder } from './embedder.type';
import type { SegmentFact, SegmentSummary, SourceSegment } from './types/source.types';

/**
 * Low-level ChromaDB Vector Store for single collection operations
 * Stores segments, summaries, or facts in a single collection
 * For multi-vector retrieval, use MultiVectorStore instead
 */
export class ChromaVectorStore extends VectorStore {
  private collectionType: 'segment' | 'summary' | 'fact';
  private client: ChromaClient;
  private collection: Collection | null = null;
  private config: VectorStoreConfig;
  private embedder: Embedder;

  constructor(config: VectorStoreConfig) {
    super();
    this.config = config;
    this.embedder = config.embedder;
    this.collectionType = config.collectionType;
    this.client = new ChromaClient();
  }

  async initialize(): Promise<void> {
    this.collection = await this.client.getOrCreateCollection({
      name: this.config.collectionName,
      metadata: { 'hnsw:space': 'cosine' } // cosine similarity
    });
  }

  // TODO: accept only the object type of the collection type?
  async addAnalyzedSegments(
    segments: Array<SegmentWithAnalysis>,
    documentId: string,
    metadata: SourceMetadata
  ): Promise<void> {
    if (!this.collection) throw new Error('Not initialized');

    // Transform to vector store format (splits into segments, summaries, facts)
    // TODO: don't reconstruct all segments, summaries, facts, just the ones that are relevant to the collection type?
    const { segments: segs, summaries, facts } = transformToVectorStoreFormat(segments, documentId, metadata);

    // Embed and add based on collection type
    if (this.collectionType === 'segment') {
      await this.addToCollection(segs);
    } else if (this.collectionType === 'summary') {
      await this.addToCollection(summaries);
    } else if (this.collectionType === 'fact') {
      await this.addToCollection(facts);
    }
  }

  /**
   * Internal method to add embeddable items to the current collection
   */
  private async addToCollection(items: Array<SourceSegment | SegmentSummary | SegmentFact>): Promise<void> {
    if (!this.collection) throw new Error('ChromaVectorStore cannot add items to a non-existent collection. Vector store not properly initialized. Call initialize() first.');
    if (items.length === 0) return; 

    // Embed items only if they don't have embeddings OR the embedding dimension is different from the embedder
    const itemsWithEmbeddings = await Promise.all(
      items.map(async (item) => {
        if (!item.embedding || item.embedding.length !== this.embedder.getDimension()) {
          const result = await this.embedder.embed(item.content);
          return { ...item, embedding: result.embedding };
        }
        return item;
      })
    );

    // Add to ChromaDB collection
    await this.collection.add({
      ids: itemsWithEmbeddings.map((item: SourceSegment | SegmentSummary | SegmentFact) => item.id),
      documents: itemsWithEmbeddings.map((item: SourceSegment | SegmentSummary | SegmentFact) => item.content),
      embeddings: itemsWithEmbeddings.map((item: SourceSegment | SegmentSummary | SegmentFact) => item.embedding || []),
      metadatas: itemsWithEmbeddings.map((item: SourceSegment | SegmentSummary | SegmentFact) => {
        const baseMetadata: Record<string, string | number> = {
          parentDocId: item.parentDocId,
          segmentIndex: item.segmentIndex
        };
        // Add parentSegmentId for summaries and facts
        if ('parentSegmentId' in item) {
          baseMetadata.parentSegmentId = item.parentSegmentId;
        }
        return serializeMetadata(item.metadata, baseMetadata);
      })
    });
  }

  /**
   * Delete items from the collection
   * @param ids - Array of item IDs to delete
   */
  async delete(ids: Array<string>): Promise<void> {
    if (!this.collection) throw new Error('ChromaVectorStore cannot delete items from a non-existent collection. Vector store not properly initialized. Call initialize() first.');
    await this.collection.delete({ ids });
  }

  async clear(): Promise<void> {
    if (!this.collection) {
      await this.client.deleteCollection({ name: this.config.collectionName });
      await this.initialize();
    }
  }

  async search(
    query: string,
    topK: number = 10
  ): Promise<Array<SearchResult<SourceSegment | SegmentSummary | SegmentFact>>> {
    if (!this.collection) throw new Error('ChromaVectorStore cannot search in a non-existent collection. Vector store not properly initialized. Call initialize() first.');

    // Embed the query
    const queryEmbedding = await this.embedder.embed(query);

    // Search ChromaDB
    const results = await this.collection.query({
      queryEmbeddings: [queryEmbedding.embedding],
      nResults: topK
    });

    // Convert to SearchResult format
    const searchResults: Array<SearchResult<SourceSegment | SegmentSummary | SegmentFact>> = [];

    if (!results.ids[0] || results.ids[0].length === 0) {
      return [];
    }

    for (let i = 0; i < results.ids[0].length; i++) {
      const id = results.ids[0][i] as string;
      const content = results.documents[0]?.[i] as string;
      const distance = results.distances?.[0]?.[i] || 0;
      const metadata = results.metadatas[0]?.[i];

      const item = {
        id,
        parentDocId: metadata?.parentDocId as string,
        segmentIndex: metadata?.segmentIndex as number,
        content,
        embedding: results.embeddings?.[0]?.[i] || [],
        metadata: deserializeMetadata(metadata || {}),
        // Add parentSegmentId for summaries/facts
        ...(metadata?.parentSegmentId && { parentSegmentId: metadata.parentSegmentId as string })
      };

      searchResults.push({
        item: item as SourceSegment | SegmentSummary | SegmentFact,
        score: 1 - distance, // Convert distance to similarity score (assuming cosine)
        distance
      });
    }

    return searchResults;
  }
}

// ----------------------------------------
// HELPERS
// ----------------------------------------

/**
 * Helper function to serialize metadata for ChromaDB
 * ChromaDB only accepts string | number | boolean in metadata
 */
function serializeMetadata(metadata: SourceMetadata, additionalFields?: Record<string, string | number>): Metadata {
  const serialized: Metadata = {
    ...(metadata.source && { source: metadata.source }),
    ...(metadata.title && { title: metadata.title }),
    ...(metadata.link && { link: metadata.link }),
    ...(metadata.authors && { authors: JSON.stringify(metadata.authors) }),
    ...(metadata.publishedDate && { publishedDate: metadata.publishedDate }),
    ...(metadata.createdAt && { createdAt: metadata.createdAt }),
    ...(metadata.locale && { locale: metadata.locale }),
    ...additionalFields
  };
  return serialized;
}

function deserializeMetadata(metadata: Metadata): SourceMetadata {
  return {
    ...(metadata.source && { source: metadata.source as string }),
    ...(metadata.title && { title: metadata.title as string }),
    ...(metadata.link && { link: metadata.link as string }),
    ...(metadata.authors && { authors: JSON.parse(metadata.authors as string) as Array<string> }),
    ...(metadata.publishedDate && { publishedDate: metadata.publishedDate as string }),
    ...(metadata.createdAt && { createdAt: metadata.createdAt as string }),
    ...(metadata.locale && { locale: metadata.locale as string })
  };
}
