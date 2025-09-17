import { createOpenAI } from '@ai-sdk/openai';
import { convertToModelMessages, streamText, type ToolSet } from 'ai';
import { toolRegistry } from './tools/registry';
import type { ChatbotAPIInput } from '../api.type';

// Main chat engine for OpenVAA chatbot
export class ChatEngine {
  static async createStream(input: ChatbotAPIInput) {
    const systemMessage = `You are a helpful voting assistant for OpenVAA. 
      User locale: ${input.context.locale}. 
      Help users understand voting and political information.`;

    const messages = convertToModelMessages(input.messages);

    // TODO: Replace with environment variable
    const openaiProvider = createOpenAI({
      apiKey: 'your-api-key'
    });

    return streamText({
      model: openaiProvider('gpt-4o-mini'),
      system: systemMessage,
      messages,
      tools: Object.fromEntries(toolRegistry) as ToolSet
    });
  }
}
