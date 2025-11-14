import { clearConversation, formatConversationAsText, getConversation } from '@openvaa/chatbot/server';
import { json } from '@sveltejs/kit';
import type { RequestEvent } from './$types';

/**
 * GET /api/conversation-logs/[sessionId]
 * Returns the full conversation log for a specific session
 * Add ?format=text to get plain text download
 */
export async function GET({ params, url }: RequestEvent) {
  try {
    const { sessionId } = params;
    const log = getConversation(sessionId);

    console.log('[API] GET conversation log for session:', sessionId);
    console.log('[API] Found log:', !!log);
    if (log) {
      console.log('[API] Log has', log.phases.length, 'phases');
      console.log(
        '[API] Total exchanges:',
        log.phases.reduce((sum, p) => sum + p.exchanges.length, 0)
      );
    }

    if (!log) {
      return json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Check if text format requested
    if (url.searchParams.get('format') === 'text') {
      const textLog = formatConversationAsText(log);
      return new Response(textLog, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="conversation-${sessionId}.txt"`
        }
      });
    }

    // Default: return JSON
    return json(log);
  } catch (error) {
    console.error('Error fetching conversation log:', error);
    return json({ error: 'Failed to fetch conversation log' }, { status: 500 });
  }
}

/**
 * DELETE /api/conversation-logs/[sessionId]
 * Clears a conversation session from memory
 */
export async function DELETE({ params }: RequestEvent) {
  try {
    const { sessionId } = params;
    const deleted = clearConversation(sessionId);

    if (!deleted) {
      return json({ error: 'Conversation not found' }, { status: 404 });
    }

    return json({ success: true, message: 'Conversation deleted' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return json({ error: 'Failed to delete conversation' }, { status: 500 });
  }
}
