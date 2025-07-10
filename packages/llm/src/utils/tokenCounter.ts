import { Message } from "../llm-providers/llm-provider";

/**
 * Estimate tokens for a request (rough approximation)
 * // TODO: improve to use a tokenizer if you want to be more accurate
 */
export function estimateTokens({ messages }: { messages: Array<Message> }): number {
  const totalText = messages.map(m => m.content).join(' ');
  return Math.ceil(totalText.length / 4) * 1.3; // Add 30% buffer for response tokens. TODO: configure.
}