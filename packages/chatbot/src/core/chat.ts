import { setPromptVars } from '@openvaa/llm-refactor';
import { stepCountIs } from 'ai';
import { getTools } from './tools/tools';
import { CHATBOT_SKILLS, FALLBACK_TOPICS } from '../defaultConfig/chatbotSkills';
import { loadPrompt } from '../utils/promptLoader';
import type { ChatbotAPIInput } from '../api.type';
import type { LoadedPrompt } from '../types/prompt.type';

// Main chat engine for OpenVAA chatbot
// Note: RAG enrichment is now handled by RAGService before calling this engine
export class ChatEngine {
  private static systemPrompt: LoadedPrompt | null = null;

  /**
   * Get system prompt with variables populated
   *
   * @returns System prompt text with chatbot skills and fallback topics
   */
  private static async getSystemPrompt(): Promise<string> {
    // Load system prompt if not already loaded
    if (!this.systemPrompt) {
      console.info('Loading ChatEngine system prompt...');
      this.systemPrompt = await loadPrompt({ promptFileName: 'systemPrompt' });
      console.info('✓ System prompt loaded');
    }

    // Populate template variables
    return setPromptVars({
      promptText: this.systemPrompt.prompt,
      variables: {
        chatbotSkills: CHATBOT_SKILLS,
        fallbackTopics: FALLBACK_TOPICS
      },
      strict: false
    });
  }

  /**
   * Create a streaming chat response
   * Note: Messages should already be enhanced with RAG context by ChatbotController if needed
   */
  static async createStream(input: ChatbotAPIInput) {
    // Get unified system prompt
    const systemMessage = await this.getSystemPrompt();

    // Use provided LLM provider
    const provider = input.chatProvider;

    const result = provider.streamText({
      system: systemMessage,
      messages: input.messages,
      tools: getTools(input.ragDependencies),
      stopWhen: stepCountIs(input.nSteps ?? 5)
    });

    return result;
  }

}
