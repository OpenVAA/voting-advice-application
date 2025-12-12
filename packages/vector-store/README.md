## Current Architecture

Base abstraction: `VectorStore`
- Segments are the primary unit of storage and retrieval
- Summaries and extracted facts are stored as metadata on segments not separately embedded

### Concrete Implementation: Chroma
- `ChromaVectorStore` implements `VectorStore`
- Segments are enriched with document metadata during ingestion
- Search returns `VectorSearchResult` with `SingleSearchResult` items
- Cohere reranking support for improved relevance