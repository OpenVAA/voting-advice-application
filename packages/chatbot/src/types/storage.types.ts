import type { ConversationState } from '../controller/chatbotController.type';

/**
 * Interface for storing and retrieving conversation state.
 * Implementations handle persistence (Redis, in-memory, etc.)
 */
export interface ConversationStateStore {
  /** Retrieve conversation state by session ID */
  get(sessionId: string): Promise<ConversationState | null>;

  /** Store conversation state with automatic 24h TTL */
  set(sessionId: string, state: ConversationState): Promise<void>;

  /** Delete conversation state (GDPR right to deletion) */
  delete(sessionId: string): Promise<void>;
}
