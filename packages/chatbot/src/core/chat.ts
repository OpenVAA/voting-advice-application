import { LLMProvider } from '@openvaa/llm-refactor';
import { stepCountIs } from 'ai';
import { getTools } from './tools/tools';
import type { ChatbotAPIInput } from '../api.type';

// Main chat engine for OpenVAA chatbot
export class ChatEngine {
  static async createStream(input: ChatbotAPIInput) {
    const systemMessage = `You are a helpful voting assistant for OpenVAA. 
      User locale: ${input.context.locale}. 
      Help users understand voting and political information.`;

    const llmProvider = new LLMProvider({
      provider: 'openai',
      apiKey:
        'your-api-key',
      modelConfig: { primary: 'gpt-4o-mini' }
    });

    const result = llmProvider.streamText({
      modelConfig: { primary: 'gpt-4o-mini' },
      system: systemMessage,
      messages: input.messages,
      tools: getTools(input.getToolsOptions?.dataProvider, input.getToolsOptions),
      stopWhen: stepCountIs(input.nSteps ?? 5)
    });

    return result;
  }
}
