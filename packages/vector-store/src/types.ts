/**
 * Browser-safe type exports from @openvaa/vector-store
 *
 * This file contains ONLY TypeScript type definitions with no runtime code
 * or class implementations. Safe for importing in browser contexts.
 *
 */

// Embedder types
export type { Embedder, EmbedderOptions, EmbedderResponse } from './core/embedder.type';
// Source segment types
export type { SegmentWithMetadata, SourceMetadata, SourceSegment } from './core/source.types';

// Vector store types
export type { ChromaVectorStore } from './core/chromaVectorStore';
export type { RerankResult } from './core/utils/rerank.types';
export type {
  RerankConfig,
  SingleSearchResult,
  VectorSearchResult,
  VectorStore,
  VectorStoreConfig
} from './core/vectorStore.type';
