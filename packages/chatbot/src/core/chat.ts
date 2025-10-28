import { LLMProvider } from '@openvaa/llm-refactor';
import { stepCountIs } from 'ai';
import { OPENAI_API_KEY } from '../apiKey';
import { loadPrompt } from '../utils/promptLoader';
import type { LLMStreamResult } from '@openvaa/llm-refactor';
import type { ChatbotAPIInput } from '../api.type';
import type { LoadedPrompt } from '../types/prompt.type';

// Main chat engine for OpenVAA chatbot
// Note: RAG enrichment is now handled by RAGService before calling this engine
export class ChatEngine {
  private static systemPrompt: LoadedPrompt | null = null;

  /**
   * Create a streaming chat response
   * Note: Messages should already be enhanced with RAG context by ChatbotController if needed
   */
  static async createStream(input: ChatbotAPIInput) {
    // Load system prompt if not already loaded  
    if (!this.systemPrompt) {
      console.info('Loading ChatEngine system prompt...');
      this.systemPrompt = await loadPrompt({ promptFileName: 'systemPrompt_v0' });
      console.info('✓ System prompt loaded');
    }

    // Use the loaded system prompt
    const systemMessage = this.systemPrompt.prompt;

    // Use provided llmProvider or create one internally
    const provider =
      input.llmProvider ??
      new LLMProvider({
        provider: 'openai',
        apiKey: OPENAI_API_KEY,
        modelConfig: { primary: 'gpt-4.1-mini' }
      });

    const result = provider.streamText({
      system: systemMessage,
      messages: input.messages,
      stopWhen: stepCountIs(input.nSteps ?? 5)
    });

    return result;
  }

  /**
   * Create a streaming response for canned messages
   * Returns LLMStreamResult-compatible object for interface consistency with LLM streams
   *
   * This avoids unnecessary LLM calls for predefined responses (zero cost, instant).
   *
   * @param message - The canned message text to stream
   * @returns LLMStreamResult-compatible stream
   */
  static async createCannedStream(message: string): Promise<LLMStreamResult> {
    // Create a minimal ReadableStream that emits the canned message
    const textStream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        // Emit message as chunks (simulate streaming for consistency)
        controller.enqueue(encoder.encode(message));
        controller.close();
      }
    });

    // Create mock usage and costs (zero cost for canned responses)
    const mockUsage = Promise.resolve({
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0
    });

    const mockCosts = Promise.resolve({
      input: 0,
      output: 0,
      total: 0
    });

    // Create minimal StreamTextResult-compatible object
    // Note: This is a simplified implementation that provides the essential methods
    // needed by the API route (toUIMessageStreamResponse, usage, costs)
    const cannedStream: LLMStreamResult = {
      textStream,
      usage: mockUsage,
      finishReason: Promise.resolve('stop'),
      text: Promise.resolve(message),
      toolCalls: Promise.resolve([]),
      toolResults: Promise.resolve([]),
      warnings: undefined,
      experimental_providerMetadata: undefined,
      rawResponse: undefined,

      // toUIMessageStreamResponse is the key method used by the API route
      toUIMessageStreamResponse(): Response {
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            // Send text chunk in AI SDK format: "0:{json}"
            controller.enqueue(encoder.encode(`0:${JSON.stringify(message)}\n`));
            controller.close();
          }
        });

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache'
          }
        });
      },

      // LLMStreamResult-specific fields
      latencyMs: 0,
      attempts: 1,
      costs: mockCosts,
      model: 'canned-response',
      fallbackUsed: false
    } as unknown as LLMStreamResult;

    return cannedStream;
  }
}
