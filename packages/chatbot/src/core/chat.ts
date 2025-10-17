import { LLMProvider } from '@openvaa/llm-refactor';
import { stepCountIs } from 'ai';
import { OPENAI_API_KEY } from '../apiKey';
import { loadPrompt } from '../utils/promptLoader';
import type { ChatbotAPIInput } from '../api.type';
import type { LoadedPrompt } from '../types/prompt.type';

// Main chat engine for OpenVAA chatbot
// Note: RAG enrichment is now handled by RAGService before calling this engine
export class ChatEngine {
  private static systemPrompt: LoadedPrompt | null = null;

  /**
   * Create a streaming chat response
   * Note: Messages should already be enhanced with RAG context by RAGService if needed
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

    const llmProvider = new LLMProvider({
      provider: 'openai',
      apiKey: OPENAI_API_KEY,
      modelConfig: { primary: 'gpt-4.1-mini' }
    });

    const result = llmProvider.streamText({
      modelConfig: { primary: 'gpt-4.1-mini' },
      system: systemMessage,
      messages: input.messages,
      stopWhen: stepCountIs(input.nSteps ?? 5)
    });

    return result;
  }
}
