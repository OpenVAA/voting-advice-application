# CLAUDE.md - Chatbot Package

## current architecture (refactored)

### streaming flow
```
API Route (frontend/src/routes/api/chat/+server.ts)
  ├─> MultiVectorStore.search() → retrieve relevant segments
  ├─> format segments for LLM prompt (only actual text, not summaries/facts)
  ├─> ChatEngine.createStream() → generate streaming response
  │     └─> LLMProvider.streamText() → AI SDK streaming
  └─> custom SSE wrapper → inject RAG events + cost/latency metadata
```

### why custom SSE handling?
- **frontend uses svelte 4** - incompatible with AI SDK's svelte hooks
- manual SSE parsing allows custom events: `rag-context`, `metadata-info`
- will migrate to AI SDK's `useChat()` hook when moving to svelte 5

### components

**ChatEngine** (`src/core/chat.ts`)
- entry point for streaming chat
- loads system prompts from `prompts/` directory
- configures LLMProvider
- returns AI SDK `StreamTextResult`

**tools** (`src/core/tools/`)
- infrastructure kept for future use
- includes ChatDataProvider type
- not currently used in chatbot

**RAGService** - REMOVED
- previously wrapped single ChromaDB collection
- replaced by direct `MultiVectorStore` usage in API routes

## important guidelines

### RAG context
- **only use actual segment text** for LLM input
- summaries and facts are for retrieval only (help find segments via MultiVectorStore)
- do NOT include AI-generated summaries/facts in LLM prompts
- risk of hallucination amplification if using AI-generated content

### types
- import from packages when available: `@openvaa/vector-store`, `@openvaa/file-processing`
- `MultiVectorSearchResult` from vector-store is the RAG data format
- UI-specific types (UIMessage, UIMessagePart) stay in frontend
- telemetry types (CostInfo, LatencyInfo) stay in frontend

### formatting utilities
- create simple formatting functions (not services/abstractions)
- keep in API route or create utils if reusable
- example: `formatSegmentsForPrompt(results: MultiVectorSearchResult): string`

## local development

### vector store
- ChromaDB data stored at `/packages/vector-store/chroma-db`
- collections: `eu-2024-segments`, `eu-2024-summaries`, `eu-2024-facts`
- ChromaClient connects to local storage by default
- run embedding script to populate: `yarn workspace @openvaa/vector-store tsx src/scripts/embeddingScript.ts`

## planned migrations

### svelte 5 migration
- **impact**: frontend only
- replace manual SSE with AI SDK's `useChat()` hook
- backend stays unchanged (RAG logic in API route works with both)
- custom events via `streamData()` in AI SDK

### supabase migration
- **decision**: keep ChromaDB for vectors (recommended)
- supabase for structured data, ChromaDB for vector search
- clean separation, no changes to MultiVectorStore needed

## tech debt
- ad hoc UI types duplicated across frontend routes
- intentional workaround for svelte 4 limitations
- will clean up when migrating to svelte 5
