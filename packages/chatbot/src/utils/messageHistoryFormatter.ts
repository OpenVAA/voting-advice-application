import type { ModelMessage } from 'ai';

/**
 * Options for formatting conversation history
 */
export interface FormatHistoryOptions {
  /**
   * Maximum number of user messages to include
   * @default 4
   */
  maxUserMessages?: number;

  /**
   * Maximum number of assistant messages to include
   * @default 4
   */
  maxAssistantMessages?: number;

  /**
   * Whether to highlight the latest user message with <<LATEST_MESSAGE>> tags
   * @default true
   */
  highlightLatest?: boolean;
}

/**
 * Format conversation history for router prompts
 *
 * Extracts the last N user messages and last N assistant messages,
 * preserves chronological order, and formats them for LLM prompts.
 *
 * The function:
 * 1. Filters messages by role (user vs assistant)
 * 2. Takes the last N of each type
 * 3. Merges them back in chronological order
 * 4. Formats with role labels
 * 5. Optionally highlights the latest user message
 *
 * @param messages - Full conversation history (chronological order)
 * @param options - Formatting options
 * @returns Formatted conversation string ready for LLM prompt
 *
 * @example
 * ```typescript
 * const formatted = formatConversationHistory(messages, {
 *   maxUserMessages: 4,
 *   maxAssistantMessages: 4,
 *   highlightLatest: true
 * });
 * // Returns:
 * // User: What is the voting age?
 * //
 * // Assistant: The voting age in EU elections is 18 in most countries.
 * //
 * // <<LATEST_MESSAGE>> User: What about in Austria? <</LATEST_MESSAGE>>
 * ```
 */
export function formatConversationHistory(
  messages: Array<ModelMessage>,
  options: FormatHistoryOptions = {}
): string {
  const {
    maxUserMessages = 4,
    maxAssistantMessages = 4,
    highlightLatest = true
  } = options;

  if (messages.length === 0) {
    return '';
  }

  // Separate messages by role
  const userMessages = messages.filter((msg) => msg.role === 'user');
  const assistantMessages = messages.filter((msg) => msg.role === 'assistant');

  // Take last N of each type
  const recentUserMessages = userMessages.slice(-maxUserMessages);
  const recentAssistantMessages = assistantMessages.slice(-maxAssistantMessages);

  // Find the earliest timestamp among selected messages to know where to start
  const selectedMessageIds = new Set([
    ...recentUserMessages.map((m) => messages.indexOf(m)),
    ...recentAssistantMessages.map((m) => messages.indexOf(m))
  ]);

  const earliestSelectedIndex = Math.min(...selectedMessageIds);

  // Filter original messages to only include selected ones, preserving order
  const orderedMessages = messages
    .slice(earliestSelectedIndex)
    .filter((msg) => selectedMessageIds.has(messages.indexOf(msg)));

  // Find the index of the last user message for highlighting
  const lastUserMessageIndex = orderedMessages.length - 1 -
    [...orderedMessages].reverse().findIndex((msg) => msg.role === 'user');

  // Format messages with role labels
  const formattedMessages = orderedMessages.map((msg, idx) => {
    const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
    const roleLabel = msg.role === 'user' ? 'User' : 'Assistant';
    const messageLine = `${roleLabel}: ${content}`;

    // Highlight latest user message if enabled
    if (highlightLatest && msg.role === 'user' && idx === lastUserMessageIndex) {
      return `<<LATEST_MESSAGE>> ${messageLine} <</LATEST_MESSAGE>>`;
    }

    return messageLine;
  });

  return formattedMessages.join('\n\n');
}
