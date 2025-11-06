import { getAllConversationSummaries } from '@openvaa/chatbot';
import { json } from '@sveltejs/kit';

/**
 * GET /api/conversation-logs
 * Returns summaries of all active conversation sessions
 */
export async function GET() {
  try {
    const summaries = getAllConversationSummaries();
    return json(summaries);
  } catch (error) {
    console.error('Error fetching conversation summaries:', error);
    return json({ error: 'Failed to fetch conversation summaries' }, { status: 500 });
  }
}
