# @openvaa/vector-store

Vector storage and semantic search package built on ChromaDB.

## Usage

From inside the vector-store package, run:

chroma run --host 0.0.0.0 --path ./chroma-db

But this requires you to first have an instantiated collection in ./chroma-db:

```typescript
import { ChromaVectorStore, OpenAIEmbedder } from '@openvaa/vector-store';

// 1. Create an embedder
const embedder = new OpenAIEmbedder({
model: 'text-embedding-3-small',
dimensions: 1536,
apiKey: process.env.OPENAI_API_KEY
});

// 2. Create and initialize the store
const store = new ChromaVectorStore({
collectionName: 'my-collection',
embedder,
chromaPath: 'http://localhost:8000' // optional, defaults to localhost:8000
});
await store.initialize();

// 3. Add segments
await store.addSegments({
segments: [
{
id: 'doc1_seg0',
documentId: 'doc1',
segmentIndex: 0,
content: 'The European Parliament has 705 members...',
summary: 'Overview of EU Parliament structure',
standaloneFacts: ['The EU Parliament has 705 members']
}
],
metadata: {
source: 'EU Parliament',
title: 'Introduction to the European Parliament',
publishedDate: '2024-01-01'
}
});

// 4. Now you can search for relevant documents
const results = await store.search({ query: 'How many MEPs are there?', topK: 10 });

for (const result of results.results) {
console.log(result.segment.content); // The matched text
console.log(result.vectorSearchScore); // Similarity score (0-1)
console.log(result.segment.metadata); // Document metadata
}
```

## Architecture

**`ChromaVectorStore`** is the main API. It implements the abstract `VectorStore` interface and handles:

- Embedding text via a pluggable `Embedder` 
- Storing segments in ChromaDB with cosine similarity
- Returning search results as `VectorSearchResult` containing `SingleSearchResult` items

**Segments** are the primary unit of storage—not full documents. Document metadata is de-normalized onto each segment during `addSegments()`, so searches return complete context without additional lookups.

## Reranking

For improved relevance, use the `rerank` utility with Cohere:

```typescript 
import { rerank } from '@openvaa/vector-store';

const reranked = await rerank({
query: 'How many MEPs are there?',
retrievedSegments: results.results.map(r => r.segment),
nBest: 5,
apiKey: 'your-api-key'
});

console.log(reranked.segments); // Top 5 reranked segments
console.log(reranked.scores.get(segId)); // Relevance score per segment## Browser Usage
```

Import types only (no runtime dependencies on ChromaDB, because they will fail):

```typescript
import type { VectorSearchResult, SingleSearchResult } from '@openvaa/vector-store/types';
```

## Common Issues

(1) Chroma not connecting when using Docker
  - Chroma creates a new config file when you instantiate it, even if you are using the same data
  - Make sure you rebuild the vector-store package and that the rebuilt version is in use in the container you are using
  - Also make sure to use the "--host 0.0.0.0" flag, so the container code can connect to it
