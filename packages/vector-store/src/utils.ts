/**
 * Browser-safe utility exports from @openvaa/vector-store
 *
 * This file contains utility functions that have no Node.js-specific dependencies.
 * Safe for importing in browser contexts (when used with appropriate LLM providers).
 *
 * Note: These utilities require LLM providers but don't directly depend on Node.js-only
 * packages like ChromaDB.
 *
 * Usage:
 *   import { routeQuery } from '@openvaa/vector-store/utils';
 */

// Query routing and reformulation
export type { QueryRoutingResult } from './core/utils/queryRouting';
export { routeQuery } from './core/utils/queryRouting';

// Query variations
export { getQueryVariations } from './core/utils/queryVariations';

// Reranking utilities
export { rerank } from './core/utils/rerank';

// Search result filtering
export { filterSearchResults } from './core/utils/searchResultFiltering';

// Data transformation utilities
export * from './core/utils/dataTransform';

// RAG requirement checking
export { isRAGRequired } from './core/utils/isRAGRequired';

// Prompt loading (may have Node.js fs dependencies - careful here)
export { loadPrompt } from './core/utils/promptLoader';
