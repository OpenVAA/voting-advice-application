/**
 * Represents a single message exchange in the conversation
 */
export interface MessageExchange {
  userMessage: string;
  assistantMessage: string;
  timestamp: Date;
}

/**
 * Complete conversation info for a session
 */
export interface ConversationLog {
  sessionId: string;
  startedAt: Date;
  exchanges: Array<MessageExchange>;
}

/**
 * Summary information about a conversation session
 */
export interface ConversationSummary {
  sessionId: string;
  startedAt: Date;
  messageCount: number;
  lastActivity: Date;
}

/**
 * In-memory storage for conversation infos
 * Key: sessionId, Value: ConversationLog
 */
const conversationStore = new Map<string, ConversationLog>();

/**
 * Formats a timestamp for display in conversation infos
 * @param date - Date to format
 * @returns Human-readable timestamp string (e.g., "2025-11-04 14:23:45")
 */
function formatTimestamp(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Formats a time-only timestamp for messages
 * @param date - Date to format
 * @returns Time string (e.g., "14:23:45")
 */
function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Creates the session header for a conversation info
 * @param sessionId - Unique session identifier
 * @param timestamp - Session start time
 * @returns Formatted session header
 */
function createSessionHeader(sessionId: string, timestamp: Date): string {
  return `================================================================================
SESSION: ${sessionId}
STARTED: ${formatTimestamp(timestamp)}
================================================================================\n\n`;
}

/**
 * Formats a message for the conversation info
 * @param role - Message role (user or assistant)
 * @param content - Message content
 * @param timestamp - Message timestamp
 * @returns Formatted message
 */
function formatMessage(role: 'user' | 'assistant', content: string, timestamp: Date): string {
  const roleLabel = role === 'user' ? 'USER' : 'ASSISTANT';
  const time = formatTime(timestamp);
  return `[${roleLabel} @ ${time}]\n${content}\n\n`;
}

/**
 * Updates the conversation log with a new user-assistant message exchange.
 * Creates a new log entry if one doesn't exist, or appends to an existing one.
 *
 * @param userMessage - The user's message text
 * @param assistantMessage - The assistant's response text
 * @param sessionId - Unique session identifier
 */
export async function updateConversation(
  userMessage: string,
  assistantMessage: string,
  sessionId: string
): Promise<void> {
  try {
    const now = new Date();
    let log = conversationStore.get(sessionId);

    if (!log) {
      // Create new conversation log
      log = {
        sessionId,
        startedAt: now,
        exchanges: []
      };
      conversationStore.set(sessionId, log);
    }

    // Add the message exchange
    log.exchanges.push({
      userMessage,
      assistantMessage,
      timestamp: now
    });
  } catch (error) {
    // Log error but don't throw - conversation logging should not break the chat
    console.error('[ConversationLogger] Failed to log conversation:', error);
  }
}

/**
 * Retrieves a conversation info for a specific session
 * @param sessionId - The session identifier
 * @returns The conversation info, or undefined if not found
 */
export function getConversation(sessionId: string): ConversationLog | undefined {
  return conversationStore.get(sessionId);
}

/**
 * Gets summaries of all active conversation sessions
 * @returns Array of conversation summaries sorted by last activity (newest first)
 */
export function getAllConversationSummaries(): Array<ConversationSummary> {
  const summaries: Array<ConversationSummary> = [];

  for (const log of conversationStore.values()) {
    const messageCount = log.exchanges.length;

    // Get timestamp of last exchange
    let lastActivity = log.startedAt;
    for (const exchange of log.exchanges) {
      if (exchange.timestamp > lastActivity) {
        lastActivity = exchange.timestamp;
      }
    }

    summaries.push({
      sessionId: log.sessionId,
      startedAt: log.startedAt,
      messageCount,
      lastActivity
    });
  }

  // Sort by last activity, newest first
  return summaries.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
}

/**
 * Clears a conversation session from memory
 * @param sessionId - The session identifier to clear
 * @returns true if session was deleted, false if not found
 */
export function clearConversation(sessionId: string): boolean {
  return conversationStore.delete(sessionId);
}

/**
 * Formats a conversation log as a human-readable text string
 * @param log - The conversation log to format
 * @returns Formatted text representation
 */
export function formatConversationAsText(log: ConversationLog): string {
  let text = createSessionHeader(log.sessionId, log.startedAt);

  for (const exchange of log.exchanges) {
    text += formatMessage('user', exchange.userMessage, exchange.timestamp);

    // Assistant message slightly after user (simulate response time)
    const assistantTimestamp = new Date(exchange.timestamp.getTime() + 2000);
    text += formatMessage('assistant', exchange.assistantMessage, assistantTimestamp);
  }

  return text;
}
