/**
 * Utilities for creating SSE (Server-Sent Events) streams
 * Compatible with AI SDK streaming format
 *
 * NOTE: This utility is intended for server-side use to create canned/static
 * SSE responses without LLM processing (e.g., error messages, rate limit
 * responses, or predetermined replies). Not currently used but kept for
 * future server-side scenarios.
 */

/**
 * Creates a ReadableStream that sends a constant text message
 * in the AI SDK SSE format (text-delta event + finish event)
 *
 * This is useful for canned responses that don't require LLM processing,
 * such as error messages, rate limit responses, or fallback messages.
 *
 * @param text - The complete text message to send
 * @returns ReadableStream in SSE format
 *
 * @example Server-side usage for a canned error response:
 * ```typescript
 * import { createConstantTextStream } from '$lib/chatbot/utils/adHocStreaming';
 *
 * // In an API route:
 * const stream = createConstantTextStream("Sorry, the service is temporarily unavailable.");
 * return new Response(stream, {
 *   headers: { 'Content-Type': 'text/event-stream' }
 * });
 * ```
 */
export function createConstantTextStream(text: string): ReadableStream {
  return new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send text as a single text-delta chunk
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text-delta', delta: text })}\n\n`));

      // Send finish event to signal completion
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'finish' })}\n\n`));

      controller.close();
    }
  });
}
