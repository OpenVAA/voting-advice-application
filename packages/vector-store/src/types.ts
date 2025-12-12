/**
 * Browser-safe type exports from @openvaa/vector-store
 *
 * This file contains ONLY TypeScript type definitions with no runtime code
 * or class implementations. Safe for importing in browser contexts.
 *
 * Usage:
 *   import type { MultiVectorSearchResult } from '@openvaa/vector-store/types';
 */

// Embedder types
export type { Embedder, EmbedderOptions, EmbedderResponse } from './core/embedder.type';

// Source segment types
export type { SegmentWithMetadata, SourceMetadata, SourceSegment } from './core/source.types';

// Vector store types
export type { SingleSearchResult, VectorSearchResult, VectorStore, VectorStoreConfig } from './core/vectorStore.type';

// Vector store class types (type-only imports from class files)
// NOTE: These imports reference files that contain ChromaDB
export type { ChromaVectorStore } from './core/chromaVectorStore';
