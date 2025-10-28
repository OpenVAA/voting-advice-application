import { ChatbotController } from '@openvaa/chatbot';
import { LLMProvider } from '@openvaa/llm-refactor';
import { MultiVectorStore, OpenAIEmbedder } from '@openvaa/vector-store';
import { convertUIMessagesToModelMessages } from '$lib/chatbot/adHocMessageConvert';
import { OPENAI_API_KEY } from './apiKey';

// Collection names for multi-vector retrieval
const COLLECTION_NAMES = {
  segments: 'eu-2024-segments',
  summaries: 'eu-2024-summaries',
  facts: 'eu-2024-facts'
} as const;

// Initialize embedder and vector store (singleton pattern)
let multiVectorStore: MultiVectorStore | null = null;
let queryReformulationProvider: LLMProvider | null = null;
let resultFilteringProvider: LLMProvider | null = null;

async function getVectorStore(): Promise<MultiVectorStore> {
  if (!multiVectorStore) {
    const embedder = new OpenAIEmbedder({
      model: 'text-embedding-3-small',
      dimensions: 1536,
      apiKey: OPENAI_API_KEY
    });

    multiVectorStore = new MultiVectorStore({
      collectionNames: COLLECTION_NAMES,
      embedder,
      chromaPath: 'http://host.docker.internal:8000'
    });

    await multiVectorStore.initialize();
  }
  return multiVectorStore;
}

function getQueryReformulationProvider(): LLMProvider {
  if (!queryReformulationProvider) {
    queryReformulationProvider = new LLMProvider({
      provider: 'openai',
      apiKey: OPENAI_API_KEY,
      modelConfig: { primary: 'gpt-4.1-nano-2025-04-14' }
    });
  }
  return queryReformulationProvider;
}

function getResultFilteringProvider(): LLMProvider {
  if (!resultFilteringProvider) {
    resultFilteringProvider = new LLMProvider({
      provider: 'openai',
      apiKey: OPENAI_API_KEY,
      modelConfig: { primary: 'gpt-5-nano' }
    });
  }
  return resultFilteringProvider;
}


// API endpoint for chat functionality with RAG enrichment
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST({ request, params }: { request: Request; params: any }) {
  const requestStartTime = Date.now();

  // Parse request
  const { messages: uiMessages } = await request.json();
  const messages = convertUIMessagesToModelMessages(uiMessages);

  // Call controller (all business logic orchestrated here)
  const response = await ChatbotController.handleQuery({
    messages,
    locale: params.lang || 'en',
    vectorStore: await getVectorStore(),
    queryReformulationProvider: getQueryReformulationProvider(),
    intelligentSearch: false,
    resultFilteringProvider: getResultFilteringProvider()
    // chatProvider omitted - ChatEngine will use its default
  });

  // Wrap in SSE stream with metadata
  return wrapInSSE({
    stream: response.stream,
    metadata: response.metadata,
    requestStartTime
  });
}

/**
 * Wrap ChatbotResponse in Server-Sent Events format
 * Pure HTTP/SSE protocol handling
 */
async function wrapInSSE({
  stream,
  metadata,
  requestStartTime
}: {
  stream: any;
  metadata: any;
  requestStartTime: number;
}) {
  const sseStream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const streamStartTime = performance.now();
      let firstTokenTime = 0;

      try {
        // Send RAG context if available (before streaming starts)
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

        // Compute timing metrics (API route's responsibility)
        const timeToFirstToken = firstTokenTime > 0 ? firstTokenTime - streamStartTime : 0;
        const messageTime = streamEndTime - streamStartTime;
        const totalTime = Date.now() - requestStartTime;

        // Get LLM costs and usage from stream
        const costs = await stream.costs;
        const usage = await stream.usage;
        const tokensPerSecond =
          usage.outputTokens && messageTime > 0 ? usage.outputTokens / (messageTime / 1000) : undefined;

        // Send combined metadata (after streaming completes)
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
