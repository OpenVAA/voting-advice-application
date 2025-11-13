import { ChromaClient } from 'chromadb';
import { ChromaVectorStore } from './chromaVectorStore';
import { reconstructSegmentWithAnalysis } from './utils/dataTransform';
import { deduplicateAndSelectResults } from './utils/deduplicateResults';
import { rerank } from './utils/rerank';
import { allocateSegmentsPerTopic } from './utils/topicAllocation';
import type { SegmentWithAnalysis, SourceMetadata } from '@openvaa/file-processing';
import type { Metadata } from 'chromadb';
import type { SegmentFact, SegmentSummary, SourceSegment } from './types';
import type {
  CollectionSearchConfig,
  EnrichedSearchResult,
  MultiVectorSearchOptions,
  MultiVectorSearchResult,
  MultiVectorStoreConfig
} from './vectorStore.type';

// Default search configuration per collection type
const DEFAULT_SEARCH_CONFIG: Record<'segment' | 'summary' | 'fact', Required<CollectionSearchConfig>> = {
  segment: { topK: 8, rerankAllocation: 30 },
  summary: { topK: 8, rerankAllocation: 50 },
  fact: { topK: 10, rerankAllocation: 20 }
};

/**
 * High-level multi-vector store for document analysis
 * Manages three collections (segments, summaries, facts) for optimal retrieval
 * This is the recommended API for most use cases
 */
export class MultiVectorStore {
  private segmentsStore: ChromaVectorStore;
  private summariesStore: ChromaVectorStore;
  private factsStore: ChromaVectorStore;
  private config: MultiVectorStoreConfig;
  private client: ChromaClient;

  constructor(config: MultiVectorStoreConfig) {
    this.config = config;
    this.client = new ChromaClient(config.chromaPath ? { path: config.chromaPath } : {});

    // Determine embedders
    // TODO: just simplify and have a single embedder for all collections. Embeddings reusable across collections.
    const segmentEmbedder = config.embedders?.segments || config.embedder;
    const summaryEmbedder = config.embedders?.summaries || config.embedder;
    const factEmbedder = config.embedders?.facts || config.embedder;

    if (!segmentEmbedder || !summaryEmbedder || !factEmbedder) {
      throw new Error(
        'Failed to create a MultiVectorStore. You must provide EITHER a single embedder for all collections (config.embedder) OR ALL embedders separately (config.embedders.segments, config.embedders.summaries & config.embedders.facts)'
      );
    }

    // Create three ChromaVectorStore instances
    this.segmentsStore = new ChromaVectorStore({
      collectionName: config.collectionNames.segments,
      collectionType: 'segment',
      embedder: segmentEmbedder,
      chromaPath: config.chromaPath
    });

    this.summariesStore = new ChromaVectorStore({
      collectionName: config.collectionNames.summaries,
      collectionType: 'summary',
      embedder: summaryEmbedder,
      chromaPath: config.chromaPath
    });

    this.factsStore = new ChromaVectorStore({
      collectionName: config.collectionNames.facts,
      collectionType: 'fact',
      embedder: factEmbedder,
      chromaPath: config.chromaPath
    });
  }

  /**
   * Initialize all three collections
   */
  async initialize(): Promise<void> {
    await Promise.all([
      this.segmentsStore.initialize(),
      this.summariesStore.initialize(),
      this.factsStore.initialize()
    ]);
  }

  /**
   * Add analyzed segments to all three collections
   * @param segments - Array of segments with analysis
   * @param documentId - ID of the parent document
   * @param metadata - Metadata for the source document
   */
  async addAnalyzedSegments( // TODO: insert only what is needed, not all segments, summaries, facts for all collections.
    segments: Array<SegmentWithAnalysis>,
    documentId: string,
    metadata: SourceMetadata
  ): Promise<void> {
    await Promise.all([
      this.segmentsStore.addAnalyzedSegments(segments, documentId, metadata),
      this.summariesStore.addAnalyzedSegments(segments, documentId, metadata),
      this.factsStore.addAnalyzedSegments(segments, documentId, metadata)
    ]);
  }

  /**
   * Multi-vector search across segments, summaries, and/or facts
   * Returns enriched segments with full analysis context
   * @param options - Search options (query, which collections, topK, filtering, etc.)
   * @returns Deduplicated enriched segments with retrieval statistics
   */
  async search(options: MultiVectorSearchOptions): Promise<MultiVectorSearchResult> {
    const {
      searchCollections = ['segment', 'summary', 'fact'],
      searchConfig = {},
      rerankConfig,
      nResultsTarget,
      queries
    } = options;

    // Validation
    if (rerankConfig?.enabled && !rerankConfig.apiKey) {
      throw new Error('[MultiVectorStore.search] Reranking requires apiKey in rerankConfig');
    }

    // Merge user config with defaults for each collection type
    function getConfig(type: 'segment' | 'summary' | 'fact'): Required<CollectionSearchConfig> {
      if (!searchConfig[type]) {
        return DEFAULT_SEARCH_CONFIG[type];
      }
      return {
        topK: searchConfig[type]?.topK ?? DEFAULT_SEARCH_CONFIG[type].topK,
        rerankAllocation: searchConfig[type]?.rerankAllocation ?? DEFAULT_SEARCH_CONFIG[type].rerankAllocation
      };
    }

    // Validate queries
    const queryTopics = Object.keys(queries);
    if (queryTopics.length === 0) {
      throw new Error('[MultiVectorStore.search] No queries provided');
    }

    // Allocate minimum segments per topic using topic names
    const minSegmentsPerTopic = allocateSegmentsPerTopic(queryTopics, nResultsTarget);

    // Get collections based on searchCollections option
    const collectionsToSearch = await Promise.all(
      searchCollections.map((type) => {
        const collectionName =
          type === 'segment'
            ? this.config.collectionNames.segments
            : type === 'summary'
              ? this.config.collectionNames.summaries
              : this.config.collectionNames.facts;
        return this.client.getOrCreateCollection({ name: collectionName }).then((coll) => ({ type, coll }));
      })
    );

    // For each topic, search all its query reformulations across all collections in parallel
    const searchResultsPerTopic = await Promise.all(
      queryTopics.map(async (topic) => {
        const topicQueries = queries[topic];

        // For each query in this topic, search all collections
        const queryResults = await Promise.all(
          topicQueries.map(async (query) => {
            // Embed query for each collection type
            const queryEmbeddings = await Promise.all(
              collectionsToSearch.map(({ type }) => {
                const embedder =
                  type === 'segment'
                    ? this.segmentsStore['embedder']
                    : type === 'summary'
                      ? this.summariesStore['embedder']
                      : this.factsStore['embedder'];
                return embedder.embed(query);
              })
            );

            // Search all collections with this query, tracking collection type
            return Promise.all(
              collectionsToSearch.map(({ type, coll }, idx) => {
                const config = getConfig(type);
                return coll
                  .query({
                    queryEmbeddings: [queryEmbeddings[idx].embedding],
                    nResults: config.topK
                  })
                  .then((result) => ({ result, collectionType: type }));
              })
            );
          })
        );

        return { topic, searchResults: queryResults.flat() };
      })
    );

    // Process per-topic results to extract segment IDs and scores
    // For each topic, track which segments were found and with what scores
    const perTopicSegmentScores = new Map<
      string,
      Map<string, { score: number; distance: number; foundWith: 'segment' | 'summary' | 'fact'; factFound?: string }>
    >();

    // Collect ALL unique segment IDs across all topics
    const allSegmentIds = new Set<string>();

    // Process each topic's search results
    for (const { topic, searchResults } of searchResultsPerTopic) {
      const topicScores = new Map<
        string,
        { score: number; distance: number; foundWith: 'segment' | 'summary' | 'fact'; factFound?: string }
      >();

      // Process each search result (from different collections and queries)
      for (const { result, collectionType } of searchResults) {
        result.ids[0]?.forEach((id, resultIdx) => {
          const distance = result.distances?.[0]?.[resultIdx] || 0;
          const score = 1 - distance; // Convert cosine distance to similarity score
          const metadata = result.metadatas[0]?.[resultIdx];

          let segmentId: string;
          let factText: string | undefined;

          if (collectionType === 'segment') {
            segmentId = id as string;
          } else if (collectionType === 'summary') {
            segmentId = metadata?.parentSegmentId as string;
            if (!segmentId) return;
          } else {
            // collectionType === 'fact'
            segmentId = metadata?.parentSegmentId as string;
            if (!segmentId) return;
            factText = result.documents[0]?.[resultIdx] as string;
          }

          // Track this segment ID globally
          allSegmentIds.add(segmentId);

          // Update this topic's best score for this segment
          const existing = topicScores.get(segmentId);
          if (!existing || existing.score < score) {
            topicScores.set(segmentId, {
              score,
              distance,
              foundWith: collectionType,
              ...(factText && { factFound: factText })
            });
          }
        });
      }

      perTopicSegmentScores.set(topic, topicScores);
    }

    // Early return if no segments found
    if (allSegmentIds.size === 0) {
      return {
        results: [],
        retrievalSources: {
          fromSegments: 0,
          fromSummaries: 0,
          fromFacts: 0
        },
        timestamp: Date.now()
      };
    }

    // Fetch all collections data for reconstruction (fetch once for all topics)
    const segmentsCollection = await this.client.getOrCreateCollection({
      name: this.config.collectionNames.segments
    });
    const summariesCollection = await this.client.getOrCreateCollection({
      name: this.config.collectionNames.summaries
    });
    const factsCollection = await this.client.getOrCreateCollection({
      name: this.config.collectionNames.facts
    });

    const [segmentData, summaryData, factData] = await Promise.all([
      segmentsCollection.get({ ids: Array.from(allSegmentIds) }),
      summariesCollection.get({
        where: { parentSegmentId: { $in: Array.from(allSegmentIds) } }
      }),
      factsCollection.get({
        where: { parentSegmentId: { $in: Array.from(allSegmentIds) } }
      })
    ]);

    // Convert to typed arrays
    const segments: Array<SourceSegment> = segmentData.ids.map((id, idx) => {
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

    const summaries: Array<SegmentSummary> = summaryData.ids.map((id, idx) => {
      const metadata = summaryData.metadatas[idx];
      return {
        id: id as string,
        parentDocId: metadata?.parentDocId as string,
        parentSegmentId: metadata?.parentSegmentId as string,
        segmentIndex: metadata?.segmentIndex as number,
        content: summaryData.documents[idx] as string,
        embedding: summaryData.embeddings?.[idx] || [],
        metadata: deserializeMetadata(metadata || {})
      };
    });

    const facts: Array<SegmentFact> = factData.ids.map((id, idx) => {
      const metadata = factData.metadatas[idx];
      return {
        id: id as string,
        parentDocId: metadata?.parentDocId as string,
        parentSegmentId: metadata?.parentSegmentId as string,
        segmentIndex: metadata?.segmentIndex as number,
        content: factData.documents[idx] as string,
        embedding: factData.embeddings?.[idx] || [],
        metadata: deserializeMetadata(metadata || {})
      };
    });

    // Reconstruct enriched segments (all segments found across all topics)
    const enrichedSegments = reconstructSegmentWithAnalysis(segments, summaries, facts);
    const enrichedSegmentsMap = new Map(enrichedSegments.map((seg) => [seg.id, seg]));

    // Build per-topic enriched results
    const perTopicResults: Record<string, Array<EnrichedSearchResult>> = {};

    for (const topic of queryTopics) {
      const topicScores = perTopicSegmentScores.get(topic);
      if (!topicScores) continue;

      const topicResults: Array<EnrichedSearchResult> = [];

      for (const [segmentId, scoreData] of topicScores.entries()) {
        const enrichedSegment = enrichedSegmentsMap.get(segmentId);
        if (!enrichedSegment) continue;

        topicResults.push({
          segment: enrichedSegment,
          vectorSearchScore: scoreData.score,
          distance: scoreData.distance,
          foundWith: scoreData.foundWith,
          ...(scoreData.factFound && { factFound: scoreData.factFound })
        });
      }

      // Sort by vector search score (highest first)
      topicResults.sort((a, b) => b.vectorSearchScore - a.vectorSearchScore);
      perTopicResults[topic] = topicResults;
    }

    // Per-topic reranking (if enabled)
    let totalRerankingCosts = 0;

    if (rerankConfig?.enabled) {
      for (const topic of queryTopics) {
        const topicResults = perTopicResults[topic];
        if (!topicResults || topicResults.length === 0) continue;

        // Use first query reformulation as canonical query for reranking
        const canonicalQuery = queries[topic][0];
        const topicSegments = topicResults.map((r) => r.segment);

        const rerankResult = await rerank({
          query: canonicalQuery,
          retrievedSegments: topicSegments,
          nBest: topicSegments.length, // Rerank all results for this topic
          apiKey: rerankConfig.apiKey,
          model: rerankConfig.model || 'rerank-v3.5'
        });

        // Add rerank scores to results
        const rerankScoreMap = rerankResult.scores;
        perTopicResults[topic] = topicResults.map((r) => ({
          ...r,
          rerankScore: rerankScoreMap.get(r.segment.id)
        }));

        // Sort by rerank score (descending)
        perTopicResults[topic].sort((a, b) => (b.rerankScore ?? 0) - (a.rerankScore ?? 0));

        // Accumulate costs
        const searchUnits = rerankResult.metadata.searchUnits ?? 0;
        totalRerankingCosts += Math.ceil((searchUnits / 100) * 0.2); // $0.2 per batch max 100
      }
    }

    // Deduplicate and select final results
    const deduplicationResult = deduplicateAndSelectResults(
      perTopicResults,
      minSegmentsPerTopic,
      nResultsTarget
    );

    // Count retrievalSources from FINAL results
    const fromSegments = deduplicationResult.results.filter((r) => r.foundWith === 'segment').length;
    const fromSummaries = deduplicationResult.results.filter((r) => r.foundWith === 'summary').length;
    const fromFacts = deduplicationResult.results.filter((r) => r.foundWith === 'fact').length;

    return {
      results: deduplicationResult.results,
      retrievalSources: {
        fromSegments,
        fromSummaries,
        fromFacts
      },
      timestamp: Date.now(),
      ...(rerankConfig?.enabled && { rerankingCosts: { cost: totalRerankingCosts } })
    };
  }

  // TODO: fix. if we even want this, we are devving this ad hoc after all..
  /**
   * Delete segments by ID from all collections
   * @param ids - Array of segment IDs to delete
   */
  async delete(ids: Array<string>): Promise<void> {
    // Also need to delete summaries and facts associated with these segments
    const summaryIds = ids.map((id) => `${id}_summary`);
    const factIds = ids.flatMap((id) => {
      // We don't know how many facts each segment has, so we'll query first
      // For now, just attempt to delete with pattern (this is a simplification)
      return [`${id}_fact_0`, `${id}_fact_1`, `${id}_fact_2`, `${id}_fact_3`, `${id}_fact_4`];
    });

    await Promise.all([
      this.segmentsStore.delete(ids),
      this.summariesStore.delete(summaryIds),
      this.factsStore.delete(factIds) // This might fail for some IDs, which is OK
    ]);
  }
}

// Helper function to deserialize metadata from ChromaDB
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
