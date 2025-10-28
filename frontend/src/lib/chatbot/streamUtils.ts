/**
 * Utilities for creating SSE (Server-Sent Events) streams
 * Compatible with AI SDK streaming format
 */

/**
 * Creates a ReadableStream that sends a constant text message
 * in the AI SDK SSE format (text-delta event + finish event)
 *
 * This is used for canned responses that don't require LLM processing
 *
 * @param text - The complete text message to send
 * @returns ReadableStream in SSE format
 *
 * @example
 * ```typescript
 * const stream = createConstantTextStream("Hello, world!");
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
