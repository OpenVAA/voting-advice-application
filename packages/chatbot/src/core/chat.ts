import { LLMProvider } from '@openvaa/llm-refactor';
import { stepCountIs } from 'ai';
import { readFile } from 'fs/promises';
import { load as loadYaml } from 'js-yaml';
import { join } from 'path';
import { OPENAI_API_KEY } from '../apiKey';
import { loadPrompt } from '../utils/promptLoader';
import type { LLMStreamResult } from '@openvaa/llm-refactor';
import type { ChatbotAPIInput } from '../api.type';
import type { ConversationPhase } from '../controller/chatbotController.type';
import type { LoadedPrompt } from '../types/prompt.type';

// Main chat engine for OpenVAA chatbot
// Note: RAG enrichment is now handled by RAGService before calling this engine
export class ChatEngine {
  private static systemPrompt: LoadedPrompt | null = null;
  private static phasePrompts: LoadedPrompt | null = null;

  /**
   * Get default system prompt (fallback when no phase specified)
   *
   * @returns Default system prompt
   */
  private static async getDefaultSystemPrompt(): Promise<string> {
    // Load system prompt if not already loaded
    if (!this.systemPrompt) {
      console.info('Loading ChatEngine system prompt...');
      this.systemPrompt = await loadPrompt({ promptFileName: 'systemPrompt_v0' });
      console.info('✓ System prompt loaded');
    }

    return this.systemPrompt.prompt;
  }

  /**
   * Get system prompt for specific conversation phase
   * Combines base prompt with phase-specific instructions
   *
   * @param phase - Conversation phase
   * @returns Composed system prompt for the phase
   */
  private static async getSystemPromptForPhase(phase: ConversationPhase): Promise<string> {
    // Load phase prompts if not already loaded
    if (!this.phasePrompts) {
      console.info('Loading phase-specific system prompts...');
      // Load the raw YAML to access the structured fields
      const filePath = join(__dirname, '..', 'prompts', 'systemPrompt_phases.yaml');
      const raw = await readFile(filePath, 'utf-8');
      const parsed = loadYaml(raw) as {
        id: string;
        params?: Record<string, string>;
        basePrompt: string;
        phasePrompts: Record<ConversationPhase, string>;
      };

      // Store as LoadedPrompt for caching (store the whole structure in prompt field)
      this.phasePrompts = {
        id: parsed.id,
        prompt: JSON.stringify(parsed), // Store full structure as JSON
        params: parsed.params,
        usedVars: []
      };
      console.info('✓ Phase prompts loaded');
    }

    // Parse the stored structure
    const parsed = JSON.parse(this.phasePrompts.prompt) as {
      basePrompt: string;
      phasePrompts: Record<ConversationPhase, string>;
    };

    const basePrompt = parsed.basePrompt || '';
    const phaseSpecific = parsed.phasePrompts?.[phase] || '';

    return `${basePrompt}\n\n${phaseSpecific}`;
  }

  /**
   * Create a streaming chat response
   * Note: Messages should already be enhanced with RAG context by ChatbotController if needed
   */
  static async createStream(input: ChatbotAPIInput) {
    // Get system prompt - use phase-specific if phase provided, otherwise use default
    const systemMessage = input.conversationPhase
      ? await this.getSystemPromptForPhase(input.conversationPhase)
      : await this.getDefaultSystemPrompt();

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
            // Send text-delta event in SSE format (matches frontend expectations)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text-delta', delta: message })}\n\n`));
            // Send finish event to signal completion
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'finish' })}\n\n`));
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
