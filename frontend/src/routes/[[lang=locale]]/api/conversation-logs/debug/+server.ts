import { getAllConversationSummaries } from '@openvaa/chatbot';
import { json } from '@sveltejs/kit';

/**
 * GET /api/conversation-logs/debug
 * Debug endpoint to inspect in-memory conversation store
 */
export async function GET() {
  try {
    const summaries = getAllConversationSummaries();

    return json({
      storeSize: summaries.length,
      sessionIds: summaries.map((s) => s.sessionId),
      summaries,
      timestamp: new Date().toISOString(),
      debug: {
        message: 'This endpoint shows raw store contents for debugging',
        tip: 'If storeSize is 0, check server logs to see if updateConversation is being called'
      }
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return json(
      {
        error: 'Failed to fetch debug info',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
