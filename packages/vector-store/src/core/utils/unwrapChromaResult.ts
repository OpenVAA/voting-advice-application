import type { Metadata } from 'chromadb';

/**
 * Unwraps the first result from ChromaDB's MultiQueryResponse.
 * ChromaDB always returns nested arrays even for single queries,
 * so this helper extracts the first query result to avoid [0] indexing everywhere.
 */
export function unwrapChromaResult(multiResponse: {
  ids: Array<Array<string>>;
  embeddings: Array<Array<Array<number>>> | null;
  documents: Array<Array<string | null>> | null;
  metadatas: Array<Array<Metadata | null>> | null;
  distances: Array<Array<number>> | null;
}): {
  ids: Array<string>;
  embeddings: Array<Array<number>> | null;
  documents: Array<string | null> | null;
  metadatas: Array<Metadata | null> | null;
  distances: Array<number> | null;
} {
  return {
    ids: multiResponse.ids[0] || [],
    embeddings: multiResponse.embeddings?.[0] || null,
    documents: multiResponse.documents?.[0] || null,
    metadatas: multiResponse.metadatas?.[0] || null,
    distances: multiResponse.distances?.[0] || null
  };
}
