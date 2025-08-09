import type OpenAI from 'openai';
import type { Message } from '../types';

export function mapToMessageParam({ role, content }: Message): OpenAI.ChatCompletionMessageParam {
  const normalizedRole = role.toLowerCase();

  switch (normalizedRole) {
    case 'system':
      return { role: 'system', content } as OpenAI.ChatCompletionSystemMessageParam;

    case 'user':
      return { role: 'user', content } as OpenAI.ChatCompletionUserMessageParam;

    case 'assistant':
      return { role: 'assistant', content } as OpenAI.ChatCompletionAssistantMessageParam;

    case 'developer':
      return { role: 'developer', content } as OpenAI.ChatCompletionDeveloperMessageParam;

    default:
      throw new Error(`Unsupported role: ${normalizedRole}`);
  }
}
