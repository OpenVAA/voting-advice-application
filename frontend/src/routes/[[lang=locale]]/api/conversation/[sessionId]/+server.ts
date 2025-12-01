import { json } from '@sveltejs/kit';
import { getRedisClient } from '$lib/server/redis/client';
import { RedisConversationStore } from '$lib/server/redis/conversationStore';
import type { RequestEvent } from '@sveltejs/kit';

const conversationStore = new RedisConversationStore(getRedisClient());

/**
 * DELETE /api/conversation/{sessionId}
 * GDPR: Right to deletion - remove user's conversation data
 */
export async function DELETE({ params }: RequestEvent) {
  try {
    const { sessionId } = params;

    if (!sessionId) {
      return json({ error: 'sessionId required' }, { status: 400 });
    }

    await conversationStore.delete(sessionId);

    return json({
      success: true,
      message: 'Conversation data deleted'
    });
  } catch (error) {
    console.error('[Delete API] Error:', error);
    return json({ error: 'Failed to delete conversation' }, { status: 500 });
  }
}
