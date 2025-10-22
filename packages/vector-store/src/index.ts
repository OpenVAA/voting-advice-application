// Core classes
export { ChromaVectorStore } from './core/chromaVectorStore';
export { MultiVectorStore } from './core/multiVectorStore';
export { OpenAIEmbedder } from './core/openAIEmbedder';

// Types
export type { Embedder, EmbedderOptions, EmbedderResponse } from './core/embedder.type';
export type { EnrichedSegment, SegmentFact, SegmentSummary, SourceSegment } from './core/types/source.types';
export type {
  EnrichedSearchResult,
  MultiVectorSearchOptions,
  MultiVectorSearchResult,
  MultiVectorStoreConfig,
  SearchResult,
  VectorStore,
  VectorStoreConfig
} from './core/vectorStore.type';

// Utilities
export * from './core/utils';
