// Core vector store exports
export { ChromaVectorStore } from './core/chromaVectorStore';
export { devEmbedder, OpenAIEmbedder } from './core/openAIEmbedder';
export { CharacterSegmenter } from './core/processing/characterSegmenter';

// Types
export type { Embedder, EmbedderOptions, EmbedderResponse } from './core/embedder.type';
export type { SearchResult, TextSegment, VectorStoreConfig } from './core/vectorStore.type';
export type { SourceDocument } from './core/types/sourceDocument';

// Base class
export { Embedder as EmbedderBase } from './core/embedder.type';
export { VectorStore } from './core/vectorStore.type';
