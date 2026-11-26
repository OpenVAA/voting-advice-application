/**
 * Svelte store for chat functionality
 * Encapsulates messages, session management, and API communication
 */

import { get, writable } from 'svelte/store';
import { isTextPart } from './types';
import { createOnboardingStream } from './utils/onboarding';
import { SSEClient } from './utils/sseClient';
import type { ChatbotQuestionContext } from '@openvaa/chatbot';
import type { ChatRequestBody, ModelMessage, UIMessage } from './types';
import type { SSECallbacks } from './utils/sseClient';

/**
 * Options for creating a chat store
 */
export interface ChatStoreOptions {
  /** Locale for the chatbot */
  locale: string;
  /** Optional question context to provide to the chatbot */
  questionContext?: ChatbotQuestionContext;
  /** Extended SSE callbacks for dev/debug features (RAG, metadata, etc.) */
  extendedCallbacks?: Pick<SSECallbacks, 'onRagContexts' | 'onMetadata'>;
}

/**
 * Chat store state
 */
export interface ChatState {
  messages: Array<UIMessage>;
  loading: boolean;
  sessionId: string | null;
  clientId: string | null;
}

/**
 * Convert a model message to a UI message
 */
function modelMessageToUIMessage(m: ModelMessage): UIMessage | null {
  if (m.role !== 'user' && m.role !== 'assistant') {
    // Skip system / tool messages for UI
    return null;
  }

  let text = '';

  if (typeof m.content === 'string') {
    text = m.content;
  } else if (Array.isArray(m.content)) {
    const textPart = m.content.find((p) => p.type === 'text');
    if (textPart?.text) text = textPart.text;
  }

  if (!text) return null;

  return {
    id: Math.random().toString(),
    role: m.role as 'user' | 'assistant',
    parts: [{ type: 'text', text, state: 'done' }]
  };
}

/**
 * Get or create a stable client ID for rate limiting
 */
function getOrCreateClientId(): string | null {
  if (typeof window === 'undefined') return null;

  let clientId = localStorage.getItem('chatbot_client_id');

  if (!clientId) {
    try {
      clientId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : null;
    } catch {
      clientId = null;
    }

    if (!clientId) {
      clientId = Math.random().toString(36).slice(2);
    }

    localStorage.setItem('chatbot_client_id', clientId);
  }

  return clientId;
}

/**
 * Create a reactive chat store
 *
 * @param options - Chat store options
 * @returns Store and methods for chat functionality
 */
export function createChatStore(options: ChatStoreOptions) {
  const { locale, questionContext, extendedCallbacks } = options;

  // Initialize state
  const initialState: ChatState = {
    messages: [],
    loading: false,
    sessionId: typeof window !== 'undefined' ? localStorage.getItem('chatbot_sessionId') : null,
    clientId: getOrCreateClientId()
  };

  const store = writable<ChatState>(initialState);

  // Track reactivity interval for cleanup
  let reactivityInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Update the store state
   */
  function update(updater: (state: ChatState) => ChatState) {
    store.update(updater);
  }

  /**
   * Start onboarding with streaming animation
   */
  function startOnboardingMessage() {
    const { message, streamPromise } = createOnboardingStream(locale);

    update((state) => ({
      ...state,
      messages: [message as UIMessage]
    }));

    // Set up interval to trigger reactivity during streaming
    reactivityInterval = setInterval(() => {
      update((state) => ({
        ...state,
        messages: [...state.messages]
      }));
    }, 50);

    streamPromise.then(() => {
      if (reactivityInterval) {
        clearInterval(reactivityInterval);
        reactivityInterval = null;
      }
      update((state) => ({
        ...state,
        messages: [...state.messages]
      }));
    });
  }

  /**
   * Initialize the chat - load history or show onboarding
   */
  async function initialize() {
    const state = get(store);

    if (state.sessionId) {
      try {
        const res = await fetch(`/api/chat?sessionId=${encodeURIComponent(state.sessionId)}`);

        if (res.ok) {
          const data = await res.json();
          const historyMessages = (data.messages as Array<ModelMessage>)
            .map(modelMessageToUIMessage)
            .filter((m): m is UIMessage => m !== null);

          if (historyMessages.length > 0) {
            update((s) => ({
              ...s,
              messages: historyMessages
            }));
            return;
          }
        } else if (res.status === 404) {
          // Stored session expired / missing; clear invalid sessionId
          update((s) => ({
            ...s,
            sessionId: null
          }));
          if (typeof window !== 'undefined') {
            localStorage.removeItem('chatbot_sessionId');
          }
        }
      } catch (error) {
        console.warn('Failed to load chat history', error);
      }
    }

    // Show onboarding if no history
    const currentState = get(store);
    if (currentState.messages.length === 0) {
      startOnboardingMessage();
    }
  }

  /**
   * Reset the conversation and start fresh
   */
  async function resetConversation() {
    const state = get(store);

    if (state.sessionId) {
      try {
        await fetch(`/api/chat?sessionId=${encodeURIComponent(state.sessionId)}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.warn('Failed to delete conversation on server', error);
      }
    }

    update((s) => ({
      ...s,
      sessionId: null,
      messages: []
    }));

    if (typeof window !== 'undefined') {
      localStorage.removeItem('chatbot_sessionId');
    }

    startOnboardingMessage();
  }

  /**
   * Send a message to the chat API
   */
  async function sendMessage(text: string) {
    const state = get(store);
    if (!text.trim() || state.loading) return;

    const userMessage: UIMessage = {
      id: Math.random().toString(),
      role: 'user',
      parts: [{ type: 'text', text, state: 'done' }]
    };

    // Create placeholder assistant message
    const assistantMessage: UIMessage = {
      id: Math.random().toString(),
      role: 'assistant',
      parts: []
    };

    update((s) => ({
      ...s,
      messages: [...s.messages, userMessage, assistantMessage],
      loading: true
    }));

    try {
      const currentState = get(store);
      const requestBody: ChatRequestBody = {
        message: text,
        sessionId: currentState.sessionId ?? undefined,
        clientId: currentState.clientId ?? undefined,
        questionContext
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Use SSE client to process the stream
      await SSEClient.processStream(response, {
        onSessionId: (newSessionId) => {
          update((s) => ({
            ...s,
            sessionId: newSessionId
          }));
          if (typeof window !== 'undefined') {
            localStorage.setItem('chatbot_sessionId', newSessionId);
          }
        },
        onTextDelta: (delta) => {
          update((s) => {
            const messages = [...s.messages];
            const lastMessage = messages[messages.length - 1];
            if (!lastMessage || lastMessage.role !== 'assistant') return s;

            const textPart = lastMessage.parts.find(isTextPart);
            if (textPart) {
              textPart.text += delta;
              textPart.state = 'streaming';
            } else {
              lastMessage.parts.push({
                type: 'text',
                text: delta,
                state: 'streaming'
              });
            }

            return {
              ...s,
              messages,
              loading: false
            };
          });
        },
        onFinish: () => {
          update((s) => {
            const messages = [...s.messages];
            const lastMessage = messages[messages.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
              lastMessage.parts.forEach((part) => {
                if (isTextPart(part)) {
                  part.state = 'done';
                }
              });
            }
            return { ...s, messages };
          });
        },
        onRagContexts: extendedCallbacks?.onRagContexts,
        onMetadata: extendedCallbacks?.onMetadata,
        onError: (error) => {
          console.error('SSE stream error:', error);
        }
      });
    } catch (error) {
      console.error('Error:', error);
      update((s) => ({
        ...s,
        messages: [
          ...s.messages,
          {
            id: Math.random().toString(),
            role: 'assistant',
            parts: [{ type: 'text', text: 'Sorry, there was an error.', state: 'done' }]
          }
        ]
      }));
    } finally {
      update((s) => ({
        ...s,
        loading: false
      }));
    }
  }

  /**
   * Cleanup function to clear intervals
   */
  function destroy() {
    if (reactivityInterval) {
      clearInterval(reactivityInterval);
      reactivityInterval = null;
    }
  }

  return {
    subscribe: store.subscribe,
    initialize,
    sendMessage,
    resetConversation,
    destroy
  };
}

export type ChatStore = ReturnType<typeof createChatStore>;
