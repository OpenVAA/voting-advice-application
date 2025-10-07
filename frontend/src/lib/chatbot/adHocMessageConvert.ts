import type { ModelMessage } from 'ai';

// Define the shape of the ad-hoc UI messages from chatbotTest/+page.svelte
// This should be kept in sync with the client-side definition.
interface UIMessagePart {
  type: string; // 'text', 'tool-findCandidateInfo', etc.
  text?: string;
  toolCallId?: string;
  input?: any;
  output?: any;
  state?: string; // 'streaming', 'done', 'input-available', etc.
}

interface UIMessage {
  id: string;
  role: 'user' | 'assistant';
  parts: Array<UIMessagePart>;
}

/**
 * Converts an array of ad-hoc UI messages into the CoreMessage format
 * that the Vercel AI SDK's streamText function expects.
 * @param uiMessages The array of messages from the client.
 * @returns An array of CoreMessage objects.
 */
export function convertUIMessagesToModelMessages(uiMessages: Array<UIMessage>): Array<ModelMessage> {
  const modelMessages: Array<ModelMessage> = [];

  for (const uiMessage of uiMessages) {
    if (uiMessage.role === 'user') {
      // For user messages, concatenate all text parts into a single content string.
      const textContent = uiMessage.parts
        .filter((part) => part.type === 'text' && part.text)
        .map((part) => part.text!)
        .join('\n');

      if (textContent) {
        modelMessages.push({ role: 'user', content: textContent });
      }
    } else if (uiMessage.role === 'assistant') {
      const assistantParts: Array<any> = [];
      const toolResultParts: Array<any> = [];

      for (const part of uiMessage.parts) {
        if (part.type === 'text' && part.text) {
          assistantParts.push({ type: 'text', text: part.text });
        } else if (part.type.startsWith('tool-') && part.toolCallId) {
          const toolName = part.type.replace('tool-', '');

          // The assistant's message should contain the tool *call*.
          assistantParts.push({
            type: 'tool-call',
            toolCallId: part.toolCallId,
            toolName,
            args: part.input ?? {}
          });

          // If the tool has run, its *result* goes into a separate 'tool' role message.
          if (part.state === 'output-available' || part.state === 'output-error') {
            toolResultParts.push({
              type: 'tool-result',
              toolCallId: part.toolCallId,
              toolName,
              result: part.output,
              isError: part.state === 'output-error'
            });
          }
        }
      }

      // Add the assistant message if it has any content.
      if (assistantParts.length > 0) {
        modelMessages.push({ role: 'assistant', content: assistantParts });
      }

      // Add the tool results message if there are any.
      if (toolResultParts.length > 0) {
        modelMessages.push({ role: 'tool', content: toolResultParts });
      }
    }
  }

  return modelMessages;
}