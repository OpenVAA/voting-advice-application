import { getOnboardingMessage } from '@openvaa/chatbot';
import { ChatbotController } from '@openvaa/chatbot/server';
import { getChatbotConfiguration } from '@openvaa/chatbot/server';
import { createRateLimitResponse } from '$lib/server/api/rateLimitHelpers';
import { wrapInSSE } from '$lib/server/api/sseHelpers';
import { constants } from '$lib/server/constants';
import { getRedisClient } from '$lib/server/redis/client';
import { RedisConversationStore } from '$lib/server/redis/conversationStore';
import { RateLimiter } from '$lib/server/redis/rateLimiter';
import type { ConversationState } from '@openvaa/chatbot/server';
import type { ChatRequestBody } from '$lib/chatbot';

// Get chatbot configuration
// TODO: move default config to chatbot package and make optional in its api
const { vectorStore, queryReformulationProvider, chatProvider } = await getChatbotConfiguration(
  constants.LLM_OPENAI_API_KEY
);

// Initialize Redis store and rate limiters (shared Redis client)
const redisClient = getRedisClient();
const conversationStore = new RedisConversationStore(redisClient);

// Anonymous-only best-practice limits:
// - clientLimiter: per anonymous browser/client
// - sessionLimiter: per chatbot conversation (sessionId)
// - ipLimiter: coarse-grained IP abuse guard
const clientRateLimiter = new RateLimiter(redisClient, 60, 60); // 60 req / 60s per client
const sessionRateLimiter = new RateLimiter(redisClient, 30, 60); // 30 req / 60s per session
const ipRateLimiter = new RateLimiter(redisClient, 300, 60); // 300 req / 60s per IP

type ChatHistoryResponse = {
  messages: ConversationState['messages'];
};

// Get full conversation history for a given session
export async function GET({ url }: { url: URL }) {
  const sessionId = url.searchParams.get('sessionId');

  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'sessionId is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const state = await conversationStore.get(sessionId);

  if (!state) {
    return new Response(JSON.stringify({ error: 'Conversation not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const body: ChatHistoryResponse = {
    messages: state.messages
  };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Delete a conversation entirely for a given session
export async function DELETE({ url }: { url: URL }) {
  const sessionId = url.searchParams.get('sessionId');

  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'sessionId is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  await conversationStore.delete(sessionId);

  return new Response(null, {
    status: 204
  });
}

// API endpoint for chat functionality with RAG enrichment
export async function POST({ request, params, getClientAddress }) {
  const requestStartTime = Date.now();
  const clientIp = getClientAddress();

  try {
    // Parse request - client sends single message with optional sessionId and questionContext
    const {
      message,
      sessionId: clientSessionId,
      clientId,
      questionContext
    } = (await request.json()) as ChatRequestBody;
    const locale = params.lang || 'en';

    // Rate limiting:
    // 1) Fairness: per anonymous client/browser (clientId, falling back to IP-derived id)
    const clientKey = clientId ? `client:${clientId}` : `client-ip:${clientIp}`;
    const clientAllowed = await clientRateLimiter.checkLimit(clientKey);
    if (!clientAllowed) {
      return createRateLimitResponse('Rate limit exceeded. Try again later.');
    }

    // 2) Per-conversation: limit per chatbot session (if we have a sessionId already)
    if (clientSessionId) {
      const sessionKey = `session:${clientSessionId}`;
      const sessionAllowed = await sessionRateLimiter.checkLimit(sessionKey);
      if (!sessionAllowed) {
        return createRateLimitResponse('Rate limit exceeded for this conversation. Try again later.');
      }
    }

    // 3) Coarse-grained IP guard
    const ipKey = `ip:${clientIp}`;
    const ipAllowed = await ipRateLimiter.checkLimit(ipKey);
    if (!ipAllowed) {
      return createRateLimitResponse('Rate limit exceeded for your network. Try again later.');
    }

    // Load or create session
    let sessionId: string;
    let state: ConversationState;

    if (clientSessionId) {
      // Try to load existing session
      const existingState = await conversationStore.get(clientSessionId);
      if (existingState) {
        sessionId = clientSessionId;
        state = existingState;
      } else {
        // Invalid sessionId - create new session
        console.warn(`[Chat API] Invalid sessionId ${clientSessionId}, creating new session`);
        sessionId = crypto.randomUUID();
        state = createNewState(sessionId, locale);
      }
    } else {
      // New conversation
      sessionId = crypto.randomUUID();
      state = createNewState(sessionId, locale);
    }

    // Append new user message to state
    state.messages.push({ role: 'user', content: message });
    state.questionContext = questionContext;

    // Business logic handled by chatbot package
    const response = await ChatbotController.handleQuery({
      locale,
      state,
      vectorStore: vectorStore,
      reformulationProvider: queryReformulationProvider,
      chatProvider,
      rerankConfig: {
        enabled: true,
        apiKey: constants.COHERE_API_KEY as string,
        model: 'rerank-v3.5'
      },
      nResultsTarget: 5
    });

    // Save updated state to Redis
    console.info('Conversation state: ' + JSON.stringify(response.state));
    await conversationStore.set(sessionId, response.state);

    // Wrap in SSE stream with RAG metadata collector
    return wrapInSSE({
      sessionId,
      stream: response.stream,
      ragMetadataCollector: response.metadata.ragMetadataCollector,
      requestStartTime,
      conversationState: response.state,
      conversationStore
    });
  } catch (error) {
    console.error('[Chat API] Error:', error);
    return new Response(JSON.stringify({ error: 'Chat service unavailable' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function createNewState(sessionId: string, locale: string): ConversationState {
  const onboardingText = getOnboardingMessage(locale);

  return {
    sessionId,
    messages: [
      {
        role: 'assistant',
        content: onboardingText
      }
    ],
    locale
  };
}
