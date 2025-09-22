import { createOpenAI } from '@ai-sdk/openai';
import { convertToModelMessages, stepCountIs, streamText, type ToolSet } from 'ai';
import { getTools } from './tools/tools';
import { openAIApiKey } from '../apiKey';
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
      apiKey: openAIApiKey
    });

    const result = streamText({
      model: openaiProvider('gpt-4o-mini'),
      system: systemMessage,
      messages,
      tools: getTools(input.getToolsOptions?.dataProvider, input.getToolsOptions) as ToolSet,
      stopWhen: stepCountIs(4),
      onFinish: (finishResult) => {
        console.info('[chatEngine.createStream]AI Stream finished:', finishResult);
      }
    });

    console.info('[chatEngine.createStream] Starting AI stream with messages:', messages);
    return result;
  }
}
