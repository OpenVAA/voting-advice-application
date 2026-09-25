/**
 * SSE (Server-Sent Events) Client Utility
 * Handles parsing and processing of SSE streams from the chat API
 */

/**
 * Callback function types for SSE events
 */
export interface SSECallbacks {
  onSessionId?: (sessionId: string) => void;
  onTextDelta?: (delta: string) => void;
  onFinish?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onRagContexts?: (contexts: Array<any>) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onMetadata?: (metadata: any) => void;
  onError?: (error: Error) => void;
}

/**
 * SSE Client for handling Server-Sent Events from the chat API
 */
export class SSEClient {
  /**
   * Process an SSE stream from a Response
   *
   * @param response - The fetch Response object with SSE stream
   * @param callbacks - Callbacks for different event types
   */
  static async processStream(response: Response, callbacks: SSECallbacks): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No reader available');
    }

    const decoder = new TextDecoder();
    let sseBuffer = '';
    let eventName = '';
    let dataBuffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });

        let newlineIndex;
        while ((newlineIndex = sseBuffer.indexOf('\n')) !== -1) {
          const line = sseBuffer.slice(0, newlineIndex);
          sseBuffer = sseBuffer.slice(newlineIndex + 1);

          if (line.startsWith('event:')) {
            eventName = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            dataBuffer += line.slice(5).trimStart() + '\n';
          } else if (line === '') {
            // Empty line signals end of event
            const raw = dataBuffer.trim();
            const currentEvent = eventName;
            eventName = '';
            dataBuffer = '';

            if (!raw) continue;
            if (raw === '[DONE]') {
              this.handleEvent({ type: 'finish' }, callbacks);
              continue;
            }

            try {
              const payload = JSON.parse(raw);
              const withType = payload.type ? payload : { type: currentEvent || payload.type, ...payload };
              this.handleEvent(withType, callbacks);
            } catch {
              console.warn('Failed to parse SSE payload:', raw);
            }
          }
        }
      }
    } catch (error) {
      if (callbacks.onError) {
        callbacks.onError(error instanceof Error ? error : new Error(String(error)));
      }
      throw error;
    }
  }

  /**
   * Handle a parsed SSE event by calling the appropriate callback
   *
   * @param event - The parsed SSE event
   * @param callbacks - Callbacks for different event types
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static handleEvent(event: any, callbacks: SSECallbacks): void {
    switch (event.type) {
      case 'session-id':
        if (callbacks.onSessionId) {
          callbacks.onSessionId(event.sessionId);
        }
        break;

      case 'text-delta':
        if (callbacks.onTextDelta) {
          callbacks.onTextDelta(event.delta);
        }
        break;

      case 'finish':
        if (callbacks.onFinish) {
          callbacks.onFinish();
        }
        break;

      case 'rag-contexts':
        if (callbacks.onRagContexts) {
          callbacks.onRagContexts(event.contexts);
        }
        break;

      case 'metadata-info':
        if (callbacks.onMetadata) {
          callbacks.onMetadata(event);
        }
        break;

      default:
        // Unknown event type, ignore
        break;
    }
  }

  /**
   * Helper to create a simple text-only SSE stream handler
   * Useful for basic chat interactions without metadata
   *
   * @param onChunk - Callback for each text chunk
   * @param onComplete - Optional callback when stream completes
   * @returns SSECallbacks object
   */
  static createTextStreamHandler(onChunk: (text: string) => void, onComplete?: () => void): SSECallbacks {
    return {
      onTextDelta: onChunk,
      onFinish: onComplete
    };
  }
}
