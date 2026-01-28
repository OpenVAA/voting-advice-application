import type { ConversationState, ConversationStateStore } from '@openvaa/chatbot/server';
import type Redis from 'ioredis';

/**
 * Redis-backed conversation state store.
 * - States expire after 24 hours
 * - Keys: conversation:state:{sessionId}
 */
export class RedisConversationStore implements ConversationStateStore {
  private readonly TTL = 24 * 60 * 60; // 24 hours in seconds
  private readonly keyPrefix = 'conversation:state:';

  constructor(private redis: Redis) {}

  private getKey(sessionId: string): string {
    return `${this.keyPrefix}${sessionId}`;
  }

  async get(sessionId: string): Promise<ConversationState | null> {
    try {
      const data = await this.redis.get(this.getKey(sessionId));
      if (!data) return null;
      return JSON.parse(data) as ConversationState;
    } catch (error) {
      console.error('[RedisConversationStore] Error getting state:', error);
      throw error;
    }
  }

  async set(sessionId: string, state: ConversationState): Promise<void> {
    try {
      const key = this.getKey(sessionId);
      const serialized = JSON.stringify(state);
      await this.redis.setex(key, this.TTL, serialized);
    } catch (error) {
      console.error('[RedisConversationStore] Error setting state:', error);
      throw error;
    }
  }

  async delete(sessionId: string): Promise<void> {
    try {
      await this.redis.del(this.getKey(sessionId));
      console.info(`[RedisConversationStore] Deleted session ${sessionId}`);
    } catch (error) {
      console.error('[RedisConversationStore] Error deleting state:', error);
      throw error;
    }
  }
}
