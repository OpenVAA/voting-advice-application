import { ChromaClient } from 'chromadb';
import { filterSearchResults } from './utils/searchResultFiltering';
import { VectorStore } from '../core/vectorStore.type';
import type { LLMModelConfig, LLMProvider } from '@openvaa/llm-refactor';
import type { Collection, Metadata } from 'chromadb';
import type { MultiVectorSearchResult, SearchResult, VectorStoreConfig } from '../core/vectorStore.type';
import type { Embedder } from './embedder.type';
import type { SegmentFact, SegmentSummary, SourceMetadata, SourceSegment } from './types';

/** ChromaDB Vector Store which stores segments, summaries, and facts separately.
 * Used for multi-vector retrieval. We actually return only the real segments but
 * we use the summaries and facts to help find the segments that match the query best.
 */
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
      metadatas: textsWithEmbeddings.map((t: SourceSegment) =>
        serializeMetadata(t.metadata, {
          parentDocId: t.parentDocId,
          segmentIndex: t.segmentIndex
        })
      )
    });
  }

  async addSummaries(summaries: Array<SegmentSummary>): Promise<void> {
    if (!this.collection) throw new Error('Not initialized');

    const summariesWithEmbeddings = await Promise.all(
      summaries.map(async (summary: SegmentSummary) => {
        if (!summary.embedding || summary.embedding.length === 0) {
          const result = await this.embedder.embed(summary.content);
          return { ...summary, embedding: result.embedding };
        }
        return summary;
      })
    );

    await this.collection.add({
      ids: summariesWithEmbeddings.map((s: SegmentSummary) => s.id),
      documents: summariesWithEmbeddings.map((s: SegmentSummary) => s.content),
      embeddings: summariesWithEmbeddings.map((s: SegmentSummary) => s.embedding || []),
      metadatas: summariesWithEmbeddings.map((s: SegmentSummary) =>
        serializeMetadata(s.metadata, {
          parentSegmentId: s.parentSegmentId,
          segmentIndex: s.segmentIndex
        })
      )
    });
  }

  async addFacts(facts: Array<SegmentFact>): Promise<void> {
    if (!this.collection) throw new Error('Not initialized');

    const factsWithEmbeddings = await Promise.all(
      facts.map(async (fact: SegmentFact) => {
        if (!fact.embedding || fact.embedding.length === 0) {
          const result = await this.embedder.embed(fact.content);
          return { ...fact, embedding: result.embedding };
        }
        return fact;
      })
    );

    await this.collection.add({
      ids: factsWithEmbeddings.map((f: SegmentFact) => f.id),
      documents: factsWithEmbeddings.map((f: SegmentFact) => f.content),
      embeddings: factsWithEmbeddings.map((f: SegmentFact) => f.embedding || []),
      metadatas: factsWithEmbeddings.map((f: SegmentFact) =>
        serializeMetadata(f.metadata, {
          parentSegmentId: f.parentSegmentId,
          segmentIndex: f.segmentIndex
        })
      )
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
    return results.ids[0].map((id: string, idx: number) => {
      const metadata = results.metadatas[0][idx];
      return {
        segment: {
          id: id as string,
          parentDocId: metadata?.parentDocId as string,
          segmentIndex: metadata?.segmentIndex as number,
          content: results.documents[0][idx] as string,
          embedding: results.embeddings?.[0][idx] || [],
          metadata: deserializeMetadata(metadata || {})
        },
        score: 1 - (results.distances?.[0][idx] || 0), // Convert distance to score
        distance: results.distances?.[0][idx] || 0
      };
    });
  }

  /**
   * Multi-vector retrieval: searches across segments, summaries, and facts collections
   * Returns deduplicated segments based on matches from all three collections
   */
  async multiVectorSearch(
    query: string,
    options: {
      segmentsCollectionName: string;
      summariesCollectionName: string;
      factsCollectionName: string;
      topKPerCollection?: number;
      getQueryVariations?: (query: string) => Array<string>;
      intelligentSearch?: boolean;
      llmProvider?: LLMProvider; // extract from config for brevity
      llmModelConfig?: LLMModelConfig;
    }
  ): Promise<MultiVectorSearchResult> {
    const {
      segmentsCollectionName,
      summariesCollectionName,
      factsCollectionName,
      topKPerCollection = 3,
      intelligentSearch = false
    } = options;

    // Get query variations (placeholder for future query transformation)
    const getQueryVariations = options.getQueryVariations || ((q: string) => [q]);
    const queryVariations = getQueryVariations(query);

    // For now, we use the same query for all collections (first variation)
    const searchQuery = queryVariations[0];
    const queryEmbedding = await this.embedder.embed(searchQuery);

    // Search all three collections in parallel
    const [segmentsCollection, summariesCollection, factsCollection] = await Promise.all([
      this.client.getOrCreateCollection({ name: segmentsCollectionName }),
      this.client.getOrCreateCollection({ name: summariesCollectionName }),
      this.client.getOrCreateCollection({ name: factsCollectionName })
    ]);

    const [segmentResults, summaryResults, factResults] = await Promise.all([
      segmentsCollection.query({
        queryEmbeddings: [queryEmbedding.embedding],
        nResults: topKPerCollection
      }),
      summariesCollection.query({
        queryEmbeddings: [queryEmbedding.embedding],
        nResults: topKPerCollection
      }),
      factsCollection.query({
        queryEmbeddings: [queryEmbedding.embedding],
        nResults: topKPerCollection
      })
    ]);

    // Map summary and fact results to their parent segment IDs
    const segmentIdsFromSummaries = new Set<string>(
      summaryResults.metadatas[0]
        ?.map((m: Metadata | null) => (m?.parentSegmentId as string) || null)
        .filter((id): id is string => Boolean(id)) || []
    );
    const segmentIdsFromFacts = new Set<string>(
      factResults.metadatas[0]
        ?.map((m: Metadata | null) => (m?.parentSegmentId as string) || null)
        .filter((id): id is string => Boolean(id)) || []
    );

    // Collect all unique segment IDs
    const allSegmentIds = new Set<string>([
      ...(segmentResults.ids[0] || []),
      ...segmentIdsFromSummaries,
      ...segmentIdsFromFacts
    ]);

    // Fetch full segment data for all unique segment IDs
    const segmentData = await segmentsCollection.get({
      ids: Array.from(allSegmentIds)
    });

    // Build the final result set with segments
    let segments: Array<SourceSegment> = segmentData.ids.map((id, idx) => {
      const metadata = segmentData.metadatas[idx];
      return {
        id: id as string,
        parentDocId: metadata?.parentDocId as string,
        segmentIndex: metadata?.segmentIndex as number,
        content: segmentData.documents[idx] as string,
        embedding: segmentData.embeddings?.[idx] || [],
        metadata: deserializeMetadata(metadata || {})
      };
    });

    // Apply intelligent filtering if enabled and LLM provider is available
    if (intelligentSearch && options.llmProvider && options.llmModelConfig) {
      segments = await filterSearchResults({
        query,
        segments,
        provider: options.llmProvider,
        modelConfig: options.llmModelConfig
      });
    } else {
      console.info(
        'Intelligent filtering is disabled. Returning all segments. ' +
          'Expected intelligentSearch flag to be true, given: ' +
          intelligentSearch +
          'Expected LLM provider, given: ' +
          options.llmProvider +
          'Expected LLM model config, given: ' +
          options.llmModelConfig
      );
    }

    return {
      segments,
      retrievalSources: {
        fromSegments: segmentResults.ids[0]?.length || 0,
        fromSummaries: segmentIdsFromSummaries.size,
        fromFacts: segmentIdsFromFacts.size
      }
    };
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

/**
 * Helper function to deserialize metadata from ChromaDB
 */
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
