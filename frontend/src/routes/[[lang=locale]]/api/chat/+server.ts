import { type ChatbotAPIInput, ChatEngine } from '@openvaa/chatbot';
import { type MultiVectorSearchResult, MultiVectorStore, OpenAIEmbedder } from '@openvaa/vector-store';
import { convertUIMessagesToModelMessages } from '$lib/chatbot/adHocMessageConvert';
import { OPENAI_API_KEY } from './apiKey';
import type { ModelMessage } from 'ai';

// Collection names for multi-vector retrieval
const COLLECTION_NAMES = {
  segments: 'eu-2024-segments',
  summaries: 'eu-2024-summaries',
  facts: 'eu-2024-facts'
} as const;

// Initialize embedder and vector store (singleton pattern)
let multiVectorStore: MultiVectorStore | null = null;

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

// Format search results for LLM prompt (only actual segments, not AI-generated content)
function formatSegmentsForPrompt(ragResult: MultiVectorSearchResult): string {
  if (ragResult.results.length === 0) {
    return 'No relevant context found.';
  }

  return ragResult.results
    .map((result) => {
      const source = result.segment.metadata.source || 'Unknown';
      return `### Source: ${source}\n${result.segment.segment}`;
    })
    .join('\n\n---\n\n');
}

// API endpoint for chat functionality with RAG enrichment
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST({ request, params }: { request: Request; params: any }) {
  const { messages: uiMessages } = await request.json();

  const messages = convertUIMessagesToModelMessages(uiMessages);

  // Get the last message safely
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage) {
    throw new Error('No messages provided');
  }

  // Get vector store and perform RAG search
  const vectorStore = await getVectorStore();
  const ragResult = await vectorStore.search({
    query: lastMessage.content as string,
    searchCollections: ['segment', 'summary', 'fact'],
    topKPerCollection: 3
  });

  // Format segments for LLM context (only actual text, not summaries/facts)
  const contextText = formatSegmentsForPrompt(ragResult);

  // Enhance message with RAG context
  const enhancedMessage: ModelMessage = {
    role: 'user',
    content: `Context:\n${contextText}\n\nUser question: ${lastMessage.content}`
  };

  const input: ChatbotAPIInput = {
    messages: [...messages.slice(0, -1), enhancedMessage],
    context: {
      locale: params.lang || 'en'
    },
    nSteps: 5
  };

  const result = await ChatEngine.createStream(input);

  // Create custom stream that sends RAG context first, then AI response, then metadata
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Track timing
      const streamStartTime = performance.now();
      let firstTokenTime = 0;

      try {
        // First, send RAG context as a custom SSE event
        if (ragResult.results.length > 0) {
          controller.enqueue(encoder.encode('event: rag-context\n'));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(ragResult)}\n\n`));
        }

        // Then pipe the AI SDK stream through while tracking timing
        const aiResponse = result.toUIMessageStreamResponse();
        const reader = aiResponse.body?.getReader();

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Track first token time
            if (firstTokenTime === 0) {
              firstTokenTime = performance.now();
            }

            controller.enqueue(value);
          }
        }

        const streamEndTime = performance.now();

        // Calculate timing metrics
        const timeToFirstToken = firstTokenTime > 0 ? firstTokenTime - streamStartTime : 0;
        const totalTime = streamEndTime - streamStartTime;

        // Get cost information
        const costs = await result.costs;

        // Calculate tokens per second (if we have output tokens from usage)
        const usage = await result.usage;
        const tokensPerSecond =
          usage.outputTokens && totalTime > 0 ? usage.outputTokens / (totalTime / 1000) : undefined;

        // Send combined metadata as a single event
        controller.enqueue(encoder.encode('event: metadata-info\n'));
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              cost: {
                input: costs.input,
                output: costs.output,
                reasoning: costs.reasoning,
                total: costs.total
              },
              latency: {
                timeToFirstToken,
                totalTime,
                tokensPerSecond
              },
              timestamp: Date.now()
            })}\n\n`
          )
        );

        controller.close();
      } catch (error) {
        console.error('Error in chat stream:', error);
        controller.error(error);
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    }
  });
}
