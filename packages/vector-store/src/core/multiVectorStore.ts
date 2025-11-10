import { ChromaClient } from 'chromadb';
import { ChromaVectorStore } from './chromaVectorStore';
import { reconstructSegmentWithAnalysis } from './utils/dataTransform';
import { rerank } from './utils/rerank';
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
  segment: { topK: 8, minSimilarity: 0.3 },
  summary: { topK: 8, minSimilarity: 0.3 },
  fact: { topK: 10, minSimilarity: 0.5 }
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
    // TODO: maybe just simplify and have a single embedder for all collections.
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
      query
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
        minSimilarity: searchConfig[type]?.minSimilarity ?? DEFAULT_SEARCH_CONFIG[type].minSimilarity
      };
    }

    // Calculate total topK for all collections
    const totalTopK = searchCollections.reduce((sum, type) => sum + getConfig(type).topK, 0);

    // Fallback: if sum(topKs) <= nResultsTarget, adjust nResultsTarget
    let adjustedNResultsTarget = nResultsTarget;
    if (totalTopK <= nResultsTarget) {
      adjustedNResultsTarget = totalTopK;
    }

    const searchQuery = query;

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

    // For each collection we want to search, get its embedder and embed the query
    const queryEmbeddings = await Promise.all(
      collectionsToSearch.map(({ type }) => {
        const embedder =
          type === 'segment'
            ? this.segmentsStore['embedder']
            : type === 'summary'
              ? this.summariesStore['embedder']
              : this.factsStore['embedder'];
        return embedder.embed(searchQuery);
      })
    );

    // Search selected collections in parallel with per-collection topK
    const searchResults = await Promise.all(
      collectionsToSearch.map(({ type, coll }, idx) => {
        const config = getConfig(type);
        return coll.query({
          queryEmbeddings: [queryEmbeddings[idx].embedding],
          nResults: config.topK
        });
      })
    );

    // Extract parent segment IDs and store their scores/distances
    const segmentIdsFromSummaries: Array<string> = [];
    const directSegmentIds: Array<string> = [];
    const segmentIdsFromFacts = new Set<string>(); // we can have multiple facts per segment

    // Map to store best score/distance for each segment ID
    const segmentScores = new Map<
      string,
      { score: number; distance: number; foundWith: 'segment' | 'summary' | 'fact' }
    >();

    // Map to store which fact was found for each segment (when foundWith === 'fact')
    const segmentFactsFound = new Map<string, string>();

    searchResults.forEach((result, idx) => {
      const collectionType = collectionsToSearch[idx].type;
      const config = getConfig(collectionType);

      result.ids[0]?.forEach((id, resultIdx) => {
        const distance = result.distances?.[0]?.[resultIdx] || 0;
        const score = 1 - distance; // Convert cosine distance to similarity score

        // Apply minSimilarity filter
        if (score < config.minSimilarity) {
          return; // Skip this result
        }

        const segmentId = id as string;
        const metadata = result.metadatas[0]?.[resultIdx];

        if (collectionType === 'segment') {
          directSegmentIds.push(segmentId);
          // Update if this is the best score for this segment
          if (!segmentScores.has(segmentId) || segmentScores.get(segmentId)!.score < score) {
            segmentScores.set(segmentId, { score, distance, foundWith: 'segment' });
          }
        } else if (collectionType === 'summary') {
          const parentSegmentId = metadata?.parentSegmentId as string;
          if (parentSegmentId) {
            segmentIdsFromSummaries.push(parentSegmentId);
            if (!segmentScores.has(parentSegmentId) || segmentScores.get(parentSegmentId)!.score < score) {
              segmentScores.set(parentSegmentId, { score, distance, foundWith: 'summary' });
            }
          }
        } else if (collectionType === 'fact') {
          const parentSegmentId = metadata?.parentSegmentId as string;
          if (parentSegmentId) {
            segmentIdsFromFacts.add(parentSegmentId);
            if (!segmentScores.has(parentSegmentId) || segmentScores.get(parentSegmentId)!.score < score) {
              segmentScores.set(parentSegmentId, { score, distance, foundWith: 'fact' });
              // Store the fact text that was found
              const factText = result.documents[0]?.[resultIdx] as string;
              if (factText) {
                segmentFactsFound.set(parentSegmentId, factText);
              }
            }
          }
        }
      });
    });

    // Collect all unique segment IDs
    const allSegmentIds = new Set<string>([...directSegmentIds, ...segmentIdsFromSummaries, ...segmentIdsFromFacts]);

    if (allSegmentIds.size === 0) {
      return {
        query,
        results: [],
        retrievalSources: {
          fromSegments: 0,
          fromSummaries: 0,
          fromFacts: 0
        },
        timestamp: Date.now()
      };
    }

    // Fetch all collections data for reconstruction
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

    // Reconstruct enriched segments
    const enrichedSegments = reconstructSegmentWithAnalysis(segments, summaries, facts);

    // Convert to search results with vector search scores
    let results: Array<EnrichedSearchResult> = enrichedSegments.map((segment) => {
      const scoreData = segmentScores.get(segment.id) || { score: 0, distance: 1, foundWith: 'segment' as const };

      return {
        segment,
        vectorSearchScore: scoreData.score,
        distance: scoreData.distance,
        foundWith: scoreData.foundWith,
        // Include the fact that was found, if this segment was found via fact search
        ...(scoreData.foundWith === 'fact' &&
          segmentFactsFound.has(segment.id) && {
            factFound: segmentFactsFound.get(segment.id)
          })
      };
    });

    // Sort by vector search score (highest first)
    results.sort((a, b) => b.vectorSearchScore - a.vectorSearchScore);

    // RERANKING STEP
    let rerankingCosts: { cost: number } | undefined;
    if (rerankConfig?.enabled && totalTopK > adjustedNResultsTarget) {
      const rerankResult = await rerank({
        query: searchQuery,
        retrievedSegments: enrichedSegments,
        nBest: adjustedNResultsTarget,
        apiKey: rerankConfig.apiKey,
        model: rerankConfig.model || 'rerank-v3.5'
      });

      // Add rerank scores to results
      const rerankScoreMap = rerankResult.scores;
      results = results.map((r) => ({
        ...r,
        rerankScore: rerankScoreMap.get(r.segment.id)
      }));

      // Filter to only reranked segments
      const rerankedIds = new Set(rerankResult.segments.map((s) => s.id));
      results = results.filter((r) => rerankedIds.has(r.segment.id));

      // Sort by rerank score (descending)
      results.sort((a, b) => (b.rerankScore ?? 0) - (a.rerankScore ?? 0));

      // Calculate cost (search units to USD)
      const searchUnits = rerankResult.metadata.searchUnits ?? 0;
      rerankingCosts = { cost: (searchUnits / 1000) * 2.0 }; // $2 per 1000 queries (Rerank 3.5)
    }

    // Final limiting to nResultsTarget
    results = results.slice(0, adjustedNResultsTarget);

    return {
      query,
      results,
      retrievalSources: {
        fromSegments: directSegmentIds.length,
        fromSummaries: segmentIdsFromSummaries.length,
        fromFacts: segmentIdsFromFacts.size
      },
      timestamp: Date.now(),
      ...(rerankingCosts && { rerankingCosts })
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
