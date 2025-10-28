# ChatbotController Architecture Plan

## Executive Summary

Create a `ChatbotController` in the chatbot package that orchestrates the entire query handling pipeline. This moves business logic from the API route (HTTP layer) into the chatbot package, making the system more testable, reusable, and maintainable.

## Current Architecture Problems

### Current Flow (❌ Broken Separation of Concerns)

```
API Route (SvelteKit)
  ├─> reformulateQuery() [vector-store]
  ├─> if (category === 'ambiguous') return canned [BUSINESS LOGIC IN HTTP!]
  ├─> if (category === 'inappropriate') return canned [BUSINESS LOGIC IN HTTP!]
  ├─> if (QUERYABLE_CATEGORIES.includes()) do RAG [BUSINESS LOGIC IN HTTP!]
  ├─> MultiVectorStore.search() [vector-store]
  ├─> formatSegmentsForPrompt() [utility function]
  ├─> setPromptVars() [message manipulation using llm-refactor utility]
  └─> ChatEngine.createStream() [chatbot]
```

**Problems:**
1. **Business logic in HTTP layer** - categorization handling should be in domain layer
2. **Not reusable** - cannot use this logic from CLI, tests, background jobs
3. **Hard to test** - need to mock HTTP to test query handling logic
4. **Violates SRP** - API route knows about categories, RAG, canned responses
5. **Dependencies unclear** - why is API route calling vector-store directly?

## Proposed Architecture

### New Flow (✅ Proper Layering)

```
API Route (SvelteKit) - Pure HTTP/SSE adapter
  └─> ChatbotController.handleQuery() [chatbot package]
        ├─> reformulateQuery() [vector-store utility]
        ├─> needsCannedResponse()? [chatbot business logic]
        │     └─> createCannedStream() [chatbot]
        ├─> isQueryable()? [chatbot business logic]
        │     └─> MultiVectorStore.search() [vector-store]
        ├─> formatRAGContext() [chatbot utility]
        ├─> setPromptVars() [chatbot utility]
        └─> ChatEngine.createStream() [chatbot]
```

**Benefits:**
1. ✅ **Business logic encapsulated** - all decisions in chatbot package
2. ✅ **Reusable** - can use controller from any context
3. ✅ **Testable** - unit test controller without HTTP mocking
4. ✅ **Clear dependencies** - chatbot orchestrates vector-store + llm
5. ✅ **Single responsibility** - API route only handles HTTP/SSE protocol

## Detailed Design

### 1. Controller Interface

```typescript
// packages/chatbot/src/controller/chatbotController.ts

export interface HandleQueryInput {
  // Core inputs
  messages: Array<ModelMessage>;  // Conversation history
  locale: string;                 // User locale for prompts

  // Infrastructure dependencies (provided by caller)
  vectorStore: MultiVectorStore;
  queryReformulationProvider: LLMProvider;
  resultFilteringProvider: LLMProvider;
  chatProvider: LLMProvider;
}

export interface ChatbotResponse {
  // Streaming response (unified for both canned + LLM responses)
  stream: StreamTextResult;

  // Metadata about how query was processed
  metadata: {
    // Categorization
    category: QueryCategory;
    reformulatedQuery: string | null;

    // Processing decisions
    isCannedResponse: boolean;
    usedRAG: boolean;

    // RAG details (if used)
    ragContext?: {
      searchResult: MultiVectorSearchResult;
      segmentsUsed: number;
      formattedContext: string;
    };

    // Cost tracking
    costs: {
      reformulation: {
        total: number;
        input: number;
        output: number;
      };
      filtering?: {
        total: number;
        input: number;
        output: number;
      };
      // LLM costs come from stream.usage
    };

    // Latency tracking (controller's responsibility)
    latency: {
      reformulationMs: number;
      retrievalMs: number;
      // TTFB and streaming time tracked by API route
    };
  };
}

export class ChatbotController {
  /**
   * Main entry point for query handling
   * Orchestrates: categorization → canned/RAG/LLM decision → streaming response
   */
  static async handleQuery(input: HandleQueryInput): Promise<ChatbotResponse> {
    // Implementation below
  }
}
```

### 2. Controller Implementation Flow

```typescript
static async handleQuery(input: HandleQueryInput): Promise<ChatbotResponse> {
  // PHASE 1: Query Categorization & Reformulation
  const reformulationStart = Date.now();
  const reformulationCostsBefore = input.queryReformulationProvider.cumulativeCosts;

  const userMessages = input.messages
    .filter((msg) => msg.role === 'user')
    .map((msg) => msg.content as string);

  const { category, rephrased } = await reformulateQuery({
    messages: userMessages,
    provider: input.queryReformulationProvider,
    categories: ALL_CATEGORY_VALUES
  });

  const reformulationCosts = {
    total: input.queryReformulationProvider.cumulativeCosts - reformulationCostsBefore,
    input: 0,  // Would need detailed tracking
    output: 0
  };
  const reformulationMs = Date.now() - reformulationStart;

  // PHASE 2: Decision - Canned Response?
  if (needsCannedResponse(category)) {
    return this.handleCannedResponse(category, {
      reformulation: reformulationCosts,
      reformulationMs
    });
  }

  // PHASE 3: Decision - RAG Retrieval?
  let ragContext;
  let retrievalMs = 0;
  let filteringCosts;

  if (isQueryable(category) && rephrased) {
    const retrievalStart = Date.now();
    const filteringCostsBefore = input.resultFilteringProvider.cumulativeCosts;

    const searchResult = await input.vectorStore.search({
      query: rephrased,
      searchCollections: ['segment', 'summary', 'fact'],
      searchConfig: {},
      intelligentSearch: true,
      llmProvider: input.resultFilteringProvider
    });

    retrievalMs = Date.now() - retrievalStart;
    filteringCosts = {
      total: searchResult.filteringCosts?.total || 0,
      input: searchResult.filteringCosts?.input || 0,
      output: searchResult.filteringCosts?.output || 0
    };

    ragContext = {
      searchResult,
      segmentsUsed: searchResult.results.length,
      formattedContext: this.formatRAGContext(searchResult)
    };
  }

  // PHASE 4: Enhance Messages with RAG (if available)
  // const messages = setPromptVars({ ... }} // see patterns below
  // 
// /**
//  * Utility function to embed template literals in prompt text with error handling
//  * @param promptText - The prompt text with {{variable}} placeholders
//  * @param variables - The variables to embed
//  * @param strict - Whether to throw an error if variables are missing or leave placeholders
//  * @param controller - The controller to use for warnings
//  * @returns The prompt text string with variables embedded
//  */
// export function setPromptVars({
//   promptText,
//   variables,
//   strict = true,
//   controller = new BaseController()
// }: {
//   promptText: string;
//   variables: Record<string, unknown>;
//   strict?: boolean;
//   controller?: Controller;
// }): string {

  // PHASE 5: Create LLM Stream
  const stream = await ChatEngine.createStream({
    messages: finalMessages,
    context: {
      locale: input.locale
    },
    nSteps: 5,
    llmProvider: input.chatProvider
  });

  return {
    stream,
    metadata: {
      category,
      reformulatedQuery: rephrased,
      isCannedResponse: false,
      usedRAG: !!ragContext,
      ragContext,
      costs: {
        reformulation: reformulationCosts,
        filtering: filteringCosts
      },
      latency: {
        reformulationMs,
        retrievalMs
      }
    }
  };
}
```

### 3. Canned Response Handling

```typescript
/**
 * Create a streaming response for canned messages
 * Returns same interface as LLM streams for consistency
 */
private static async handleCannedResponse(
  category: QueryCategory,
  metrics: { reformulation: CostInfo; reformulationMs: number }
): Promise<ChatbotResponse> {
  const message = getCannedResponse(category);
  if (!message) {
    throw new Error(`No canned response defined for category: ${category}`);
  }

  // Create a fake StreamTextResult that emits the canned message
  // This maintains interface consistency with LLM responses
  const stream = await ChatEngine.createCannedStream(message);

  return {
    stream,
    metadata: {
      category,
      reformulatedQuery: null,
      isCannedResponse: true,
      usedRAG: false,
      costs: {
        reformulation: metrics.reformulation
      },
      latency: {
        reformulationMs: metrics.reformulationMs,
        retrievalMs: 0
      }
    }
  };
}
```

### 4. Utility Methods

```typescript
/**
 * Format RAG search results for LLM prompt
 * Only includes actual segment text, not AI-generated summaries/facts
 */
private static formatRAGContext(searchResult: MultiVectorSearchResult): string {
  if (searchResult.results.length === 0) {
    return 'No relevant context found.';
  }

  return searchResult.results
    .map((result) => {
      const source = result.segment.metadata.source || 'Unknown';
      return `### Source: ${source}\n${result.segment.segment}`;
    })
    .join('\n\n---\n\n');
}

```

### 5. ChatEngine Updates

Need to add `createCannedStream()` method to ChatEngine:

```typescript
// packages/chatbot/src/core/chat.ts

export class ChatEngine {
  // ... existing methods ...

  /**
   * Create a streaming response for canned messages
   * Maintains interface consistency with LLM streams
   */
  static async createCannedStream(message: string): Promise<StreamTextResult> {
    // Use AI SDK's streamText with a mock completion
    // This ensures interface compatibility
    return streamText({
      model: openai('gpt-4o-mini'), // Lightweight model for canned responses
      messages: [
        {
          role: 'user',
          content: 'Return exactly this message: ' + message
        }
      ],
      temperature: 0,
      maxTokens: 200
    });
  }
}
```

**Alternative (better):** Create a minimal StreamTextResult compatible object:

```typescript
static async createCannedStream(message: string): Promise<StreamTextResult> {
  // Create a minimal stream that just emits the canned message
  // This avoids unnecessary LLM calls for canned responses
  // TODO: Implement custom StreamTextResult-compatible object
  // For now, use AI SDK streamText with minimal tokens
}
```

## API Route Refactoring

### Before (115 lines of business logic)

```typescript
export async function POST({ request, params }) {
  const { messages: uiMessages } = await request.json();
  const messages = convertUIMessagesToModelMessages(uiMessages);

  // Categorization
  const reformulationResult = await reformulateQuery({...});
  const { category, rephrased } = reformulationResult;

  // Canned response handling
  if (category === 'ambiguous') {
    const clarificationStream = new ReadableStream({...});
    return new Response(clarificationStream, {...});
  }

  if (category === 'inappropriate') {
    const inappropriateStream = new ReadableStream({...});
    return new Response(inappropriateStream, {...});
  }

  // RAG decision
  const needsRAG = QUERYABLE_CATEGORIES.includes(category);

  // RAG retrieval
  if (needsRAG && rephrased) {
    ragResult = await vectorStore.search({...});
    contextText = formatSegmentsForPrompt(ragResult);
  }

  // Message enhancement
  const enhancedMessage = needsRAG ? {...} : lastMessage;

  // LLM streaming
  const result = await ChatEngine.createStream({...});

  // Custom SSE stream with metadata
  const stream = new ReadableStream({...});
  return new Response(stream, {...});
}
```

### After (~30 lines of HTTP handling)

```typescript
export async function POST({ request, params }) {
  const requestStartTime = Date.now();

  // 1. Parse request
  const { messages: uiMessages } = await request.json();
  const messages = convertUIMessagesToModelMessages(uiMessages);

  // 2. Call controller (all business logic here)
  const response = await ChatbotController.handleQuery({
    messages,
    locale: params.lang || 'en',
    vectorStore: await getVectorStore(),
    queryReformulationProvider: getQueryReformulationProvider(),
    resultFilteringProvider: getResultFilteringProvider(),
    chatProvider: getChatProvider()
  });

  // 3. Wrap in SSE stream with metadata
  return wrapInSSE({
    stream: response.stream,
    metadata: response.metadata,
    requestStartTime
  });
}

/**
 * Pure SSE protocol handling
 * Wraps ChatbotResponse in Server-Sent Events format
 */
async function wrapInSSE({
  stream,
  metadata,
  requestStartTime
}: {
  stream: StreamTextResult;
  metadata: ChatbotResponse['metadata'];
  requestStartTime: number;
}) {
  const sseStream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const streamStartTime = performance.now();
      let firstTokenTime = 0;

      try {
        // Send RAG context if available
        if (metadata.ragContext) {
          controller.enqueue(encoder.encode('event: rag-context\n'));
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(metadata.ragContext.searchResult)}\n\n`)
          );
        }

        // Pipe AI SDK stream
        const aiResponse = stream.toUIMessageStreamResponse();
        const reader = aiResponse.body?.getReader();

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            if (firstTokenTime === 0) {
              firstTokenTime = performance.now();
            }

            controller.enqueue(value);
          }
        }

        const streamEndTime = performance.now();

        // Compute API route's timing metrics
        const timeToFirstToken = firstTokenTime > 0 ? firstTokenTime - streamStartTime : 0;
        const messageTime = streamEndTime - streamStartTime;
        const totalTime = Date.now() - requestStartTime;

        // Get LLM costs and usage from stream
        const costs = await stream.costs;
        const usage = await stream.usage;
        const tokensPerSecond =
          usage.outputTokens && messageTime > 0 ? usage.outputTokens / (messageTime / 1000) : undefined;

        // Send combined metadata
        controller.enqueue(encoder.encode('event: metadata-info\n'));
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              cost: {
                llm: costs,
                reformulation: metadata.costs.reformulation,
                filtering: metadata.costs.filtering || { input: 0, output: 0, total: 0 },
                total:
                  costs.total +
                  metadata.costs.reformulation.total +
                  (metadata.costs.filtering?.total || 0)
              },
              latency: {
                reformulationDuration: metadata.latency.reformulationMs,
                retrievalDuration: metadata.latency.retrievalMs,
                timeToFirstToken,
                messageTime,
                totalTime,
                tokensPerSecond
              },
              rag: {
                category: metadata.category,
                reformulatedQuery: metadata.reformulatedQuery,
                needsRAG: metadata.usedRAG,
                segmentsRetrieved: metadata.ragContext?.segmentsUsed ?? 0
              },
              timestamp: Date.now()
            })}\n\n`
          )
        );

        controller.close();
      } catch (error) {
        console.error('Error in SSE stream:', error);
        controller.error(error);
      }
    }
  });

  return new Response(sseStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    }
  });
}
```

## File Structure

```
packages/chatbot/src/
├── controller/
│   ├── chatbotController.ts        # Main controller
│   ├── chatbotController.type.ts   # Interface definitions
│   └── index.ts                    # Exports
├── core/
│   ├── chat.ts                     # ChatEngine (add createCannedStream)
│   ├── categoryConfig.ts           # Existing category logic
│   └── queryCategory.type.ts       # Existing types
└── index.ts                        # Add controller exports
```

## Testing Strategy

### Controller Unit Tests

```typescript
// packages/chatbot/src/controller/chatbotController.test.ts

describe('ChatbotController', () => {
  it('returns canned response for ambiguous queries', async () => {
    const response = await ChatbotController.handleQuery({
      messages: [{ role: 'user', content: 'incredible' }], // no other context
      // ... mock providers
    });

    expect(response.metadata.isCannedResponse).toBe(true);
    expect(response.metadata.category).toBe('ambiguous');
    expect(response.metadata.usedRAG).toBe(false);
  });

  it('performs RAG for queryable categories', async () => {
    const mockVectorStore = {
      search: vi.fn().mockResolvedValue({ results: [...] })
    };

    const response = await ChatbotController.handleQuery({
      messages: [{ role: 'user', content: 'what is the eu parliament?' }],
      vectorStore: mockVectorStore,
      // ... other providers
    });

    expect(response.metadata.usedRAG).toBe(true);
    expect(mockVectorStore.search).toHaveBeenCalled();
  });

  it('skips RAG for non-queryable categories', async () => {
    const mockVectorStore = {
      search: vi.fn()
    };

    const response = await ChatbotController.handleQuery({
      messages: [{ role: 'user', content: 'thank you' }],
      vectorStore: mockVectorStore,
      // ... other providers
    });

    expect(response.metadata.usedRAG).toBe(false);
    expect(mockVectorStore.search).not.toHaveBeenCalled();
    expect(response.metadata.category).toBE('conversational')
  });
});
```

## Migration Plan

### Phase 1: Create Controller (Non-Breaking)
1. Create `packages/chatbot/src/controller/` directory
2. Implement `ChatbotController` class
3. Add `ChatEngine.createCannedStream()` method
4. Add unit tests
5. Build and verify chatbot package compiles

### Phase 2: Refactor API Route
1. Update imports in API route
2. Replace business logic with `ChatbotController.handleQuery()`
3. Move SSE handling to `wrapInSSE()` utility
4. Remove hardcoded constants and duplicate logic

### Phase 3: Cleanup
1. Run `yarn dev:update` to rebuild packages
2. Test end-to-end in UI (let this be human-in-the-loop)

## Design Decisions

### 1. Why Controller Returns StreamTextResult?
**Decision:** Return `{ stream, metadata }` instead of embedding metadata in stream

**Reasoning:**
- Keeps controller agnostic to transport layer (HTTP/SSE/WebSocket)
- Metadata separate from streaming content
- Can migrate to AI SDK's `streamData()` when upgrading to Svelte 5
- Easier to test

### 2. Why Canned Responses Use Streams?
**Decision:** Create streaming wrapper for canned messages

**Reasoning:**
- Unified interface - caller doesn't care if response is canned or LLM
- Simplifies API route logic (always handle stream)
- Future-proof for progressive rendering
- Consistent metadata structure

**Alternative Considered:** Return different types for canned vs LLM
- Rejected: Would complicate API route with type checking

### 3. Why Controller Doesn't Manage Singletons?
**Decision:** Caller provides LLMProvider and MultiVectorStore instances

**Reasoning:**
- Controller is pure business logic, not infrastructure
- Singleton management is framework-specific (e.g., SvelteKit module scope)
- Easier to test with dependency injection
- Reusable in different contexts (worker threads, serverless)

### 4. Why Not Use ChatEngine Directly?
**Decision:** Controller orchestrates ChatEngine + RAG + categorization

**Reasoning:**
- ChatEngine focused on LLM streaming only
- Controller handles higher-level flow (when to RAG, when to use canned)
- Separation: ChatEngine = LLM wrapper, Controller = business orchestrator

## TODO:

### 1. Canned Stream Implementation
**Question:** Should we use a real LLM call for canned responses or create a mock stream?

**Answer:**
Create custom StreamTextResult-compatible object
  - Pros: Zero cost, instant response
  - Cons: Need to implement StreamTextResult interface

### 2. Error Handling Strategy
**Question:** How should controller handle errors?

**Answer::**
Throw errors, let caller handle
  - Simple, clear responsibility

### 3. Streaming Metadata
**Question:** When to send metadata - before stream, during, or after?

**Answer:** Keep current split - RAG before, costs after

## Success Criteria
✅ Zero business logic in API route
✅ All tests pass
✅ Can call `ChatbotController.handleQuery()` from unit tests without HTTP
✅ Same functionality as current implementation
✅ No breaking changes to frontend UI
✅ Metadata events still work (`rag-context`, `metadata-info`)

## Next Steps

1. Review this plan - are we aligned?
2. Clarify open questions (canned stream implementation, error handling)
3. Implement Phase 1 (controller creation)
4. Test controller in isolation
5. Implement Phase 2 (API route refactor)
6. E2E testing
