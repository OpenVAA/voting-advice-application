# @openvaa/vector-store

Vector storage and semantic search package built on ChromaDB.

## Usage

From inside the vector-store package, run:

chroma run --host 0.0.0.0 --path ./chroma-db

But this requires you to first have an instantiated collection in ./chroma-db:

```typescript
import { ChromaVectorStore, OpenAIEmbedder } from '@openvaa/vector-store';

// 1. Create an Embedder
const embedder: Embedder = new OpenAIEmbedder({
  model: 'text-embedding-3-small',
  dimensions: 1536,
  apiKey: process.env.OPENAI_API_KEY
});

// 2. Create and initialize a VectorStore
const store: VectorStore = new ChromaVectorStore({
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
      content: 'The European Parliament has 720 members...',
      summary: 'Overview of EU Parliament structure',
      standaloneFacts: ['The EU Parliament has 720 members']
    }
  ],
  metadata: {
    source: 'EU Parliament',
    title: 'Introduction to the European Parliament',
    publishedDate: '2024-01-01'
  }
});
```

It is important to note that document metadata is de-normalized (saved to each segment separately) inside `addSegments()`. We want searches return complete context without having to get segment metadata separately, but before we embed segments to the vector store, we don't have to duplicate identical metadata in every segment instance.

## Architecture

**`ChromaVectorStore`** is the main API. It implements the abstract `VectorStore` interface and handles:

- Embedding text via a pluggable `Embedder`
- Storing segments in ChromaDB with cosine similarity
- Returning search results as `VectorSearchResult` containing `SingleSearchResult` items

**Segments** are the primary unit of storage, not full documents. Full document storage is not yet implemented.

## Reranking

For improved relevance, use the `rerank` utility with Cohere:

```typescript
import { rerank } from '@openvaa/vector-store';

const reranked = await rerank({
  query: 'How many MEPs are there?',
  retrievedSegments: results.results.map((r) => r.segment),
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
